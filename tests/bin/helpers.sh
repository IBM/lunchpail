#!/usr/bin/env bash

set -eo pipefail

# in case there are things we want to do differently knowing that we
# are running a test (e.g. to produce more predictible output);
# e.g. see 7/init.sh
export RUNNING_LUNCHPAIL_TESTS=1

# app.kubernetes.io/component label of pod that houses local s3
S3C=workstealer

while getopts "gi:e:nx:" opt
do
    case $opt in
        e) EXCLUDE=$OPTARG; continue;;
        i) INCLUDE=$OPTARG; continue;;
        g) DEBUG=true; continue;;
    esac
done
xOPTIND=$OPTIND
OPTIND=1

TEST_FROM_ARGV_idx=$((xOPTIND))
export TEST_FROM_ARGV="${!TEST_FROM_ARGV_idx}"

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

function waitForIt {
    local name=$1
    local ns=$2
    local api=$3
    local dones=("${@:4}") # an array formed from everything from the fourth argument on... 

    if [[ -n "$DEBUG" ]]
    then
        set -x
        LP_VERBOSE=true
    else
        LP_VERBOSE=false
    fi

    local dashc_dispatcher="-c dispatcher"
    local dashc_workers="-c workers"

    # don't track dispatcher logs if we are dispatching via the command line
    if [[ -n "$up_args" ]] || [[ -n "$inputapp" ]]
    then dashc_dispatcher=""
    fi

    echo "$(tput setaf 2)🧪 Checking job output app=$appname$(tput sgr0)" 1>&2
    for done in "${dones[@]}"; do
        while true; do
            $testapp logs --verbose=$LP_VERBOSE --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns $dashc_workers $dashc_dispatcher | grep -E "$done" && break || echo "$(tput setaf 5)🧪 Still waiting for output $done test=$name...$(tput sgr0)"
            sleep 4
        done
    done

    # Note: we will use --run $run_name in a few places, but not all
    # -- intentionally so we have test coverage of both code paths
    local run_name=$($testapp status runs --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns --latest --name)
    if [ -n "$run_name" ]
    then echo "✅ PASS found run_name test=$name run_name=$run_name"
    else echo "❌ FAIL empty run_name test=$name" && return 1
    fi

    if [[ "$api" != "workqueue" ]] || [[ ${NUM_DESIRED_OUTPUTS:-1} = 0 ]]
    then echo "✅ PASS run api=$api test=$name"
    else
        step=0
        if [[ -n "$inputapp" ]]
        then step=1
        fi
        
        while true
        do
            echo "$(tput setaf 2)🧪 Checking output files test=$name run=$run_name namespace=$ns num_desired_outputs=${NUM_DESIRED_OUTPUTS:-1}$(tput sgr0)" 1>&2
            nOutputs=$($testapp queue ls --step $step --run $run_name --target ${LUNCHPAIL_TARGET:-kubernetes} exitcode | wc -l | xargs)

            if [[ $nOutputs -ge ${NUM_DESIRED_OUTPUTS:-1} ]]
            then break
            fi

            echo "$(tput setaf 2)🧪 Still waiting test=$name for expectedNumOutputs=${NUM_DESIRED_OUTPUTS:-1} actualNumOutputs=$nOutputs$(tput sgr0)"
            echo "Current output files: $($testapp queue ls --step $step --run $run_name --target ${LUNCHPAIL_TARGET:-kubernetes} exitcode)"
            sleep 1
        done
            echo "✅ PASS run api=$api test=$name nOutputs=$nOutputs"
            outputs=$($testapp queue ls --step $step --run $run_name --target ${LUNCHPAIL_TARGET:-kubernetes} exitcode)
            echo "Outputs: $outputs"

            # Note: these validations race against run teardown: once
            # all outputs have been consumed, the workstealer touches
            # the alldone marker and minio self-destructs shortly
            # after. Validate each marker category once for all
            # outputs (rather than per-output), and bound the wait,
            # so that we either finish or fail -- rather than hang.
            local ofile="succeeded"
            if [ -n "$expectTaskFailure" ]
            then ofile="failed"
            fi

            for marker in $ofile stdout stderr
            do
                # 120s: generous enough for slow CI machines, short enough to fail within the job timeout
                local retries=120
                while true
                do
                    local listing="$($testapp queue ls --step $step --run $run_name --target ${LUNCHPAIL_TARGET:-kubernetes} $marker 2>/dev/null)"
                    local missing=0
                    for output in $outputs
                    do
                        if ! echo "$listing" | grep -Fq "$(basename $output)"
                        then missing=1 && break
                        fi
                    done
                    if [[ $missing = 0 ]]
                    then break
                    fi
                    if [[ $retries -le 0 ]]
                    then echo "❌ FAIL timed out waiting for $marker files test=$name" && return 1
                    fi
                    echo "Still waiting for $marker files test=$name (retries left=$retries)" && sleep 1
                    retries=$((retries-1))
                done
                echo "✅ PASS got expected $marker files test=$name"
            done
    fi

    # Some tests may be very slow if we wait for them to run to completion
    if [[ -z "$NO_WAIT_FOR_COMPLETION" ]]
    then waitForEveryoneToDie $run_name
    fi

    return 0
}

function waitForEveryoneToDie {
    local run_name=$1
    waitForNInstances 0 $run_name workdispatcher
    waitForNInstances 0 $run_name workerpool

    if [[ "$NUM_DESIRED_OUTPUTS:-1" != "0" ]]
    then
        # workstealer should not auto-self-destruct since we have not drained the output
        waitForNInstances 1 $run_name workstealer

        # now the workstealer should self-destruct
        waitForNInstances 0 $run_name workstealer drain
    else
        waitForNInstances 0 $run_name workstealer drain
    fi

    waitForNInstances 0 $run_name minio
}

function waitForNInstances {
    local N=$1
    local run_name=$2
    local component=$3
    local drain=$4
    echo "Checking that N=$N $component are running for run=$run_name"
    while true
    do
        if [[ -n "$drain" ]]
        then
            # drain the output
            step=0
            if [[ -n "$inputapp" ]]
            then step=1
            fi
            echo "Draining outbox"
            set +e
            env LUNCHPAIL_WAIT=false $testapp queue drain --target ${LUNCHPAIL_TARGET:-kubernetes} --run $run_name --step $step 2>&1 | grep -v "connection refused"
            set -e
        fi

        nRunning=$($testapp status instances --run $run_name --target ${LUNCHPAIL_TARGET:-kubernetes} --component $component -n $ns)
        if [[ $nRunning == $N ]]
        then echo "✅ PASS test=$name n=$N $component remain running" && break
        else echo "Waiting because $nRunning (expected $N) ${component}(s) running" && sleep 2
        fi
    done
}

# Checks if the the amount of unassigned tasks remaining is 0 and the number of tasks in the outbox is 6
function waitForUnassignedAndOutbox {
    local name=$1
    local ns=$2
    local api=$3
    local expectedUnassignedTasks=$4
    local expectedNumInOutbox=$5
    local dataset=$6
    local waitForMix=$7 # wait for a mix of values that sum up to $expectedNumInOutbox
    
    echo "$(tput setaf 2)🧪 Waiting for job to finish app=$name ns=$ns$(tput sgr0)" 1>&2

    if ! [[ $expectedUnassignedTasks =~ ^[0-9]+$ ]]; then echo "error: expectedUnassignedTasks not a number: '$expectedUnassignedTasks'"; fi
    if ! [[ $expectedNumInOutbox =~ ^[0-9]+$ ]]; then echo "error: expectedNumInOutbox not a number: '$expectedNumInOutbox'"; fi

    step=0
    if [[ -n "$inputapp" ]]
    then step=1
    fi
    
    runNum=1
    while true
    do
        echo
        echo "Run #${runNum}: here's expected unassigned tasks=${expectedUnassignedTasks}"
        actualUnassignedTasks=$($testapp queue last --step $step --target ${LUNCHPAIL_TARGET:-kubernetes} unassigned)

        if ! [[ $actualUnassignedTasks =~ ^[0-9]+$ ]]; then echo "error: actualUnassignedTasks not a number: '$actualUnassignedTasks'"; fi

        echo "expected unassigned tasks=${expectedUnassignedTasks} and actual num unassigned=${actualUnassignedTasks}"
        if [[ "$actualUnassignedTasks" != "$expectedUnassignedTasks" ]]
        then
            echo "unassigned tasks should be ${expectedUnassignedTasks} but we got ${actualUnassignedTasks}"
            sleep 2
        else
            break
        fi

        runNum=$((runNum+1))
    done

    runIter=1
    while true
    do
        echo
        echo "Run #${runIter}: here's the expected num in Outboxes=${expectedNumInOutbox}"
        numQueues=$($testapp queue last --step $step --target ${LUNCHPAIL_TARGET:-kubernetes} workers)
        actualNumInOutbox=$($testapp queue last --step $step --target ${LUNCHPAIL_TARGET:-kubernetes} success)

        if [[ -z "$waitForMix" ]]
        then
            # Wait for a single value (single pool tests)
            if ! [[ $actualNumInOutbox =~ ^[0-9]+$ ]]; then echo "error: actualNumInOutbox not a number: '$actualNumInOutbox'"; fi
            if [[ "$actualNumInOutbox" != "$expectedNumInOutbox" ]]; then echo "tasks in outboxes should be ${expectedNumInOutbox} but we got ${actualNumInOutbox}"; sleep 2; else break; fi
        else
            # Wait for a mix of values (multi-pool tests). The "mix" is
            # one per worker, and we want the total to be what we
            # expect, and that each worker contributes at least one
            gotMix=$($testapp queue last --step $step --target ${LUNCHPAIL_TARGET:-kubernetes} worker.success)
            gotMixFrom=0
            gotMixTotal=0
            for actual in $gotMix
            do
                if [[ $actual > 0 ]]
                then
                    gotMixFrom=$((gotMixFrom+1))
                    gotMixTotal=$((gotMixTotal+$actual))
                fi
            done

            if [[ $gotMixFrom = $numQueues ]] && [[ $gotMixTotal -ge $expectedNumInOutbox ]]
            then break
            else
                echo "non-zero tasks in outboxes should be ${numQueues} but we got $gotMixFrom; gotMixTotal=$gotMixTotal vs expectedNumInOutbox=$expectedNumInOutbox actualNumInOutbox=${actualNumInOutbox}"
                sleep 2
            fi
        fi

        runIter=$((runIter+1))
    done
    echo "✅ PASS run test $name"

    local run_name=$($testapp status runs --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns --latest --name)
    echo "✅ PASS found run test=$name"

    waitForEveryoneToDie $run_name
}

function build {
    "$SCRIPTDIR"/build.sh $@
}

function undeploy {
    ("$SCRIPTDIR"/undeploy-tests.sh $@ 2>&1 | grep -v 'No runs found' || exit 0)
}
