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

    echo "$(tput setaf 2)🧪 Checking job output app=$appname$(tput sgr0)" 1>&2
    for done in "${dones[@]}"; do
        idx=0
        while true; do
            if [[ -n $DEBUG ]] || (( $idx > 10 ))
            then set -x
            fi
            $testapp logs --verbose=$LP_VERBOSE --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns -c workers -c dispatcher | grep -E "$done" && break || echo "$(tput setaf 5)🧪 Still waiting for output $done test=$name...$(tput sgr0)"
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
                ($testapp logs --verbose=$LP_VERBOSE --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns -c workers --tail=$TAIL || exit 0)
                ($testapp logs --verbose=$LP_VERBOSE --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns -c dispatcher --tail=$TAIL || exit 0)
            fi
            idx=$((idx + 1))
            sleep 4
        done
    done

    # Note: we will use --run $run_name in a few places, but not all
    # -- intentionally so we have test coverage of both code paths
    local run_name=$($testapp run list --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns --latest --name)
    echo "✅ PASS run-controller found run test=$name run_name=$run_name"

    if [[ "$api" != "workqueue" ]] || [[ ${NUM_DESIRED_OUTPUTS:-1} = 0 ]]
    then echo "✅ PASS run-controller run api=$api test=$name"
    else
        while true
        do
            echo "$(tput setaf 2)🧪 Checking output files test=$name run=$run_name namespace=$ns num_desired_outputs=${NUM_DESIRED_OUTPUTS:-1}$(tput sgr0)" 1>&2
            nOutputs=$($testapp qls --run $run_name --target ${LUNCHPAIL_TARGET:-kubernetes} outbox | grep -Evs '(\.code|\.stderr|\.stdout|\.succeeded|\.failed)$' | grep -sv '/' | awk '{print $NF}' | wc -l | xargs)

            if [[ $nOutputs -ge ${NUM_DESIRED_OUTPUTS:-1} ]]
            then break
            fi

            echo "$(tput setaf 2)🧪 Still waiting test=$name for expectedNumOutputs=${NUM_DESIRED_OUTPUTS:-1} actualNumOutputs=$nOutputs$(tput sgr0)"
            echo "Current output files: $($testapp qls --target ${LUNCHPAIL_TARGET:-kubernetes} outbox)"
            sleep 1
        done
            echo "✅ PASS run-controller run api=$api test=$name nOutputs=$nOutputs"
            outputs=$($testapp qls --target ${LUNCHPAIL_TARGET:-kubernetes} outbox | grep -Evs '(\.code|\.stderr|\.stdout|\.succeeded|\.failed)$' | grep -sv '/' | awk '{print $NF}')
            echo "Outputs: $outputs"
            allOutputs=$($testapp qls --target ${LUNCHPAIL_TARGET:-kubernetes} outbox)
            echo "AllOutputs: $allOutputs"
            for output in $outputs
            do
                echo "Checking output=$output"
                code=$($testapp qcat --run $run_name --target ${LUNCHPAIL_TARGET:-kubernetes} outbox/${output}.code)
                if [[ $code = 0 ]] || [[ $code = -1 ]] || [[ $code = 143 ]] || [[ $code = 137 ]]
                then echo "✅ PASS run-controller test=$name output=$output code=0"
                else 
                    if [[ -n "$expectTaskFailure" ]]
                    then 
                        if [[ ! "$code" =~ $expectTaskFailure ]]
                        then echo "Missing expected task failure output from code=$code" && return 1
                        fi
                        echo "✅ PASS run-controller got expected non-zero exit code test=$name output=$output code=$code"
                    else echo "❌ FAIL run-controller non-zero exit code test=$name output=$output code=$code" && return 1
                    fi
                fi

                stdout=$($testapp qls --target ${LUNCHPAIL_TARGET:-kubernetes} outbox/${output}.stdout | wc -l | xargs)
                if [[ $stdout != 1 ]]
                then echo "❌ FAIL run-controller missing stdout test=$name output=$output" && return 1
                else echo "✅ PASS run-controller got stdout file test=$name output=$output"
                fi

                stderr=$($testapp qls --target ${LUNCHPAIL_TARGET:-kubernetes} outbox/${output}.stderr | wc -l | xargs)
                if [[ $stderr != 1 ]]
                then echo "❌ FAIL run-controller missing stderr test=$name output=$output" && return 1
                else echo "✅ PASS run-controller got stderr file test=$name output=$output"
                fi
            done

        echo "Checking for done file (from dispatcher)"
        while true
        do
            donefilecount=$($testapp qls --target ${LUNCHPAIL_TARGET:-kubernetes} done | wc -l | xargs)
            if [[ $donefilecount == 1 ]]
            then echo "✅ PASS run-controller test=$name donefile exists" && break
            else echo "still waiting for dispatcher donefile" && sleep 2
            fi
        done

        waitForEveryoneToDie
    fi

    return 0
}

function waitForEveryoneToDie {
    waitForNoInstances workdispatcher
    waitForNoInstances workerpool
    waitForNoInstances workstealer
    waitForNoInstances minio
}

function waitForNoInstances {
    local component=$1
    echo "Checking that no $component remain running"
    while true
    do
        nRunning=$($testapp run instances --target ${LUNCHPAIL_TARGET:-kubernetes} --component $component -n $ns)
        if [[ $nRunning == 0 ]]
        then echo "✅ PASS run-controller test=$name no $component remain running" && break
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
        actualUnassignedTasks=$($testapp qlast --target ${LUNCHPAIL_TARGET:-kubernetes} unassigned)

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
        numQueues=$($testapp qlast --target ${LUNCHPAIL_TARGET:-kubernetes} workers)
        actualNumInOutbox=$($testapp qlast --target ${LUNCHPAIL_TARGET:-kubernetes} success)

        if [[ -z "$waitForMix" ]]
        then
            # Wait for a single value (single pool tests)
            if ! [[ $actualNumInOutbox =~ ^[0-9]+$ ]]; then echo "error: actualNumInOutbox not a number: '$actualNumInOutbox'"; fi
            if [[ "$actualNumInOutbox" != "$expectedNumInOutbox" ]]; then echo "tasks in outboxes should be ${expectedNumInOutbox} but we got ${actualNumInOutbox}"; sleep 2; else break; fi
        else
            # Wait for a mix of values (multi-pool tests). The "mix" is
            # one per worker, and we want the total to be what we
            # expect, and that each worker contributes at least one
            gotMix=$($testapp qlast --target ${LUNCHPAIL_TARGET:-kubernetes} worker.success)
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
    echo "✅ PASS run-controller run test $name"

    local run_name=$($testapp run list --target ${LUNCHPAIL_TARGET:-kubernetes} -n $ns --latest --name)
    echo "✅ PASS run-controller found run test=$name"

    waitForEveryoneToDie
}

function compile {
    "$SCRIPTDIR"/compile.sh $@
}

function undeploy {
    ("$SCRIPTDIR"/undeploy-tests.sh $@ 2>&1 | grep -v 'No runs found' || exit 0)
}
