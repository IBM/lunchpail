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
    if [[ -n "$up_args" ]]
    then dashc_dispatcher=""
    fi

    echo "$(tput setaf 2)🧪 Checking job output app=$appname$(tput sgr0)" 1>&2
    for done in "${dones[@]}"; do
        idx=0
        while true; do
            if [[ -n $DEBUG ]] || (( $idx > 10 ))
            then set -x
            fi
            $testapp logs --verbose=$LP_VERBOSE --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns $dashc_workers $dashc_dispatcher | grep -E "$done" && break || echo "$(tput setaf 5)🧪 Still waiting for output $done test=$name...$(tput sgr0)"
            if [[ -n $DEBUG ]] || (( $idx > 10 ))
            then set +x
            fi

            if [[ -n $DEBUG ]] || (( $idx > 10 )); then
                # if we can't find $done in the logs after a few
                # iterations, start printing out raw logs to help with
                # debugging
                if (( $idx < 12 ))
                then TAIL=1000
                else TAIL=10
                fi
                ($testapp logs --verbose=$LP_VERBOSE --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns $dashc_workers --tail=$TAIL || exit 0)
                if [[ -z "$up_args" ]]
                then ($testapp logs --verbose=$LP_VERBOSE --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns $dashc_dispatcher --tail=$TAIL || exit 0)
                fi
            fi
            idx=$((idx + 1))
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
        while true
        do
            echo "$(tput setaf 2)🧪 Checking output files test=$name run=$run_name namespace=$ns num_desired_outputs=${NUM_DESIRED_OUTPUTS:-1}$(tput sgr0)" 1>&2
            nOutputs=$($testapp queue ls --run $run_name --target ${LUNCHPAIL_TARGET:-kubernetes} outbox | grep -Evs '(\.code|\.stderr|\.stdout|\.succeeded|\.failed)$' | grep -sv '/' | awk '{print $NF}' | wc -l | xargs)

            if [[ $nOutputs -ge ${NUM_DESIRED_OUTPUTS:-1} ]]
            then break
            fi

            echo "$(tput setaf 2)🧪 Still waiting test=$name for expectedNumOutputs=${NUM_DESIRED_OUTPUTS:-1} actualNumOutputs=$nOutputs$(tput sgr0)"
            echo "Current output files: $($testapp queue ls --target ${LUNCHPAIL_TARGET:-kubernetes} outbox)"
            sleep 1
        done
            echo "✅ PASS run api=$api test=$name nOutputs=$nOutputs"
            outputs=$($testapp queue ls --target ${LUNCHPAIL_TARGET:-kubernetes} outbox | grep -Evs '(\.code|\.stderr|\.stdout|\.succeeded|\.failed)$' | grep -sv '/' | awk '{print $NF}')
            echo "Outputs: $outputs"
            allOutputs=$($testapp queue ls --target ${LUNCHPAIL_TARGET:-kubernetes} outbox)
            for output in $outputs
            do
                echo "Checking output=$output"

                if echo "$allOutputs" | grep -Fq "${output}".code
                then echo "✅ PASS got code file test=$name output=$output"
                else echo "❌ FAIL missing code test=$name output=$output allOutputs=$allOutputs" && return 1
                fi

                local ofile="succeeded"
                if [ -n "$expectTaskFailure" ]
                then ofile="failed"
                fi
                if echo "$allOutputs" | grep -Fq "${output}.$ofile"
                then echo "✅ PASS got expected $ofile file test=$name output=$output"
                else echo "❌ FAIL missing expected $ofile file test=$name output=$output ofile=${output}.$ofile allOutputs=$allOutputs" && return 1
                fi

                if echo "$allOutputs" | grep -Fq "${output}".stdout 
                then echo "✅ PASS got stdout file test=$name output=$output"
                else echo "❌ FAIL missing stdout test=$name output=$output allOutputs=$allOutputs" && return 1
                fi

                if echo "$allOutputs" | grep -Fq "${output}".stderr
                then echo "✅ PASS got stderr file test=$name output=$output"
                else echo "❌ FAIL missing stderr test=$name output=$output allOutputs=$allOutputs" && return 1
                fi
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
    waitForNoInstances $run_name workdispatcher
    waitForNoInstances $run_name workerpool
    waitForNoInstances $run_name workstealer
    waitForNoInstances $run_name minio
}

function waitForNoInstances {
    local run_name=$1
    local component=$2
    echo "Checking that no $component remain running for run=$run_name"
    while true
    do
        nRunning=$($testapp status instances --run $run_name --target ${LUNCHPAIL_TARGET:-kubernetes} --component $component -n $ns)
        if [[ $nRunning == 0 ]]
        then echo "✅ PASS test=$name no $component remain running" && break
        else echo "$nRunning ${component}(s) remaining running" && sleep 2
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
    
    runNum=1
    while true
    do
        echo
        echo "Run #${runNum}: here's expected unassigned tasks=${expectedUnassignedTasks}"
        actualUnassignedTasks=$($testapp queue last --target ${LUNCHPAIL_TARGET:-kubernetes} unassigned)

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
        numQueues=$($testapp queue last --target ${LUNCHPAIL_TARGET:-kubernetes} workers)
        actualNumInOutbox=$($testapp queue last --target ${LUNCHPAIL_TARGET:-kubernetes} success)

        if [[ -z "$waitForMix" ]]
        then
            # Wait for a single value (single pool tests)
            if ! [[ $actualNumInOutbox =~ ^[0-9]+$ ]]; then echo "error: actualNumInOutbox not a number: '$actualNumInOutbox'"; fi
            if [[ "$actualNumInOutbox" != "$expectedNumInOutbox" ]]; then echo "tasks in outboxes should be ${expectedNumInOutbox} but we got ${actualNumInOutbox}"; sleep 2; else break; fi
        else
            # Wait for a mix of values (multi-pool tests). The "mix" is
            # one per worker, and we want the total to be what we
            # expect, and that each worker contributes at least one
            gotMix=$($testapp queue last --target ${LUNCHPAIL_TARGET:-kubernetes} worker.success)
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
