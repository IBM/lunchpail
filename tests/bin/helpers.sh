#!/usr/bin/env bash

set -e
set -o pipefail

# in case there are things we want to do differently knowing that we
# are running a test (e.g. to produce more predictible output);
# e.g. see 7/init.sh
export RUNNING_CODEFLARE_TESTS=1

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
. "$SCRIPTDIR"/../../hack/settings.sh

function up {
    local MAIN_SCRIPTDIR=$(cd $(dirname "$0") && pwd)
    "$SCRIPTDIR"/up.sh
}

function waitForIt {
    local name=$1
    local ns=$2
    local api=$3
    local dones=("${@:4}") # an array formed from everything from the fourth argument on... 

    # Future readers: the != part is meant to avoid any pods that are
    # known to be short-lived without this, we may witness a
    # combination of Ready and Complete (i.e. not-Ready) pods. This is
    # important because pthe kubectl waits below expect the pods
    # either to be all-Ready or all-not-Ready.
    local selector=app.kubernetes.io/component!=workdispatcher,app.kubernetes.io/component!=lunchpail-controller

    if [[ "$api" = ray ]]; then
        local containers="-c job-logs"
    else
        local containers="--all-containers"
    fi

    if [[ -n "$DEBUG" ]]; then set -x; fi

    # (kubectl -n $ns wait pod -l $selector --for=condition=Completed --timeout=-1s && pkill $$)

    echo "$(tput setaf 2)🧪 Waiting for job to finish app=$selector ns=$ns$(tput sgr0)" 1>&2
    while true; do
        kubectl -n $ns wait pod -l $selector --for=condition=Ready --timeout=5s && break || echo "$(tput setaf 5)🧪 Run not found: $selector$(tput sgr0)"

        kubectl -n $ns wait pod -l $selector --for=condition=Ready=false --timeout=5s && break || echo "$(tput setaf 5)🧪 Run not found: $selector$(tput sgr0)"
        sleep 4
    done

    echo "$(tput setaf 2)🧪 Checking job output app=$selector$(tput sgr0)" 1>&2
    for done in "${dones[@]}"; do
        idx=0
        while true; do
            kubectl -n $ns logs $containers -l $selector --tail=-1 | grep -E "$done" && break || echo "$(tput setaf 5)🧪 Still waiting for output $done test=$name...$(tput sgr0)"

            if [[ -n $DEBUG ]] || (( $idx > 10 )); then
                # if we can't find $done in the logs after a few
                # iterations, start printing out raw logs to help with
                # debugging
                if (( $idx < 12 ))
                then TAIL=1000
                else TAIL=10
                fi
                (kubectl -n $ns logs $containers -l $selector --tail=$TAIL || exit 0)
            fi
            idx=$((idx + 1))
            sleep 4
        done
    done

    local run_name=$(kubectl -n $ns get pod -o custom-columns=N:'.metadata.labels.app\.kubernetes\.io/instance' --no-headers | head -1)
    echo "✅ PASS run-controller found run test=$name"

    if [[ "$api" != "workqueue" ]] || [[ ${NUM_DESIRED_OUTPUTS:-1} = 0 ]]
    then echo "✅ PASS run-controller run api=$api test=$name"
    else
        local queue=${taskqueue-$(kubectl -n $ns get secret -l app.kubernetes.io/component=taskqueue,app.kubernetes.io/instance=$run_name --no-headers -o custom-columns=NAME:.metadata.name)}

        echo "$(tput setaf 2)🧪 Checking output files test=$name run=$run_name$(tput sgr0) namespace=$ns" 1>&2
        nOutputs=$(kubectl exec $(kubectl get pod -n $ns -l app.kubernetes.io/component=s3 -o name) -n $ns -- \
                            mc ls s3/$queue/lunchpail/$run_name/outbox | grep -Evs '(\.code|\.stderr|\.stdout|\.succeeded|\.failed)$' | grep -sv '/' | awk '{print $NF}' | wc -l | xargs)

        echo "Checking for done file (from dispatcher)"
        donefilecount=$(kubectl exec $(kubectl get pod -n $ns -l app.kubernetes.io/component=s3 -o name) -n $ns -- \
                                mc ls s3/$queue/lunchpail/$run_name/done | wc -l | xargs)
        if [[ $donefilecount == 1 ]]
        then echo "✅ PASS run-controller test=$name donefile exists"
        else echo "❌ FAIL run-controller donefile missing" && return 1
        fi
        
        if [[ $nOutputs -ge ${NUM_DESIRED_OUTPUTS:-1} ]]
        then
            echo "✅ PASS run-controller run api=$api test=$name nOutputs=$nOutputs"
            outputs=$(kubectl exec $(kubectl get pod -n $ns -l app.kubernetes.io/component=s3 -o name) -n $ns -- \
                               mc ls s3/$queue/lunchpail/$run_name/outbox | grep -Evs '(\.code|\.stderr|\.stdout|\.succeeded|\.failed)$' | grep -sv '/' | awk '{print $NF}')
            echo "Outputs: $outputs"
            for output in $outputs
            do
                echo "Checking output=$output"
                code=$(kubectl exec $(kubectl get pod -n $ns -l app.kubernetes.io/component=s3 -o name) -n $ns -- \
                                mc cat s3/$queue/lunchpail/$run_name/outbox/${output}.code)
                if [[ $code = 0 ]] || [[ $code = -1 ]] || [[ $code = 143 ]] || [[ $code = 137 ]]
                then echo "✅ PASS run-controller test=$name output=$output code=0"
                else echo "❌ FAIL run-controller non-zero exit code test=$name output=$output code=$code" && return 1
                fi

                stdout=$(kubectl exec $(kubectl get pod -n $ns -l app.kubernetes.io/component=s3 -o name) -n $ns -- \
                                  mc ls s3/$queue/lunchpail/$run_name/outbox/${output}.stdout | wc -l | xargs)
                if [[ $stdout != 1 ]]
                then echo "❌ FAIL run-controller missing stdout test=$name output=$output" && return 1
                else echo "✅ PASS run-controller got stdout file test=$name output=$output"
                fi

                stderr=$(kubectl exec $(kubectl get pod -n $ns -l app.kubernetes.io/component=s3 -o name) -n $ns -- \
                                  mc ls s3/$queue/lunchpail/$run_name/outbox/${output}.stderr | wc -l | xargs)
                if [[ $stderr != 1 ]]
                then echo "❌ FAIL run-controller missing stderr test=$name output=$output" && return 1
                else echo "✅ PASS run-controller got stderr file test=$name output=$output"
                fi
            done
        else
            echo "❌ FAIL run-controller run test $selector: bad nOutputs=$nOutputs" && return 1
        fi
    fi

    return 0
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
        # here we use jq to sum up all of the unassigned annotations
        actualUnassignedTasks=$("$SCRIPTDIR"/../../builds/test/$name/test qlast unassigned)

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
        numQueues=$("$SCRIPTDIR"/../../builds/test/$name/test qlast liveworkers)
        actualNumInOutbox=$("$SCRIPTDIR"/../../builds/test/$name/test qlast success)

        if [[ -z "$waitForMix" ]]
        then
            # Wait for a single value (single pool tests)
            if ! [[ $actualNumInOutbox =~ ^[0-9]+$ ]]; then echo "error: actualNumInOutbox not a number: '$actualNumInOutbox'"; fi
            if [[ "$actualNumInOutbox" != "$expectedNumInOutbox" ]]; then echo "tasks in outboxes should be ${expectedNumInOutbox} but we got ${actualNumInOutbox}"; sleep 2; else break; fi
        else
            # Wait for a mix of values (multi-pool tests). The "mix" is
            # one per worker, and we want the total to be what we
            # expect, and that each worker contributes at least one
            gotMix=$("$SCRIPTDIR"/../../builds/test/$name/test qlast liveworker.success)
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

    local run_name=$(kubectl -n $ns get pod -o custom-columns=N:'.metadata.labels.app\.kubernetes\.io/instance' --no-headers | head -1)
    echo "✅ PASS run-controller found run test=$name"
}

function waitForStatus {
    local name=$1
    local ns=$2
    local api=$3
    local statuses=("${@:4}") # an array formed from everything from the fourth argument on... 

    if [[ -n "$DEBUG" ]]; then set -x; fi

    echo "$(tput setaf 2)🧪 Waiting for job to finish app=$selector ns=$ns$(tput sgr0)" 1>&2
    for status in "${statuses[@]}"
    do
        while true
        do
            kubectl -n $ns get run.lunchpail.io $name --no-headers | grep -q "$status" && break || echo "$(tput setaf 5)🧪 Still waiting for Failed: $name$(tput sgr0)"
            (kubectl -n $ns get run.lunchpail.io $name --show-kind --no-headers | grep $name || exit 0)
            sleep 4
        done
    done

    echo "✅ PASS run-controller run test $name"

    kubectl delete run $name -n $ns
    echo "✅ PASS run-controller delete test $name"
}

function deploy {
    "$SCRIPTDIR"/deploy-tests.sh $@
}

function undeploy {
    ("$SCRIPTDIR"/undeploy-tests.sh $@ || exit 0)
}

function watch {
    kubectl get pod --show-kind -A --watch &
    kubectl get run --show-kind --all-namespaces --watch &
    kubectl get workerpool --watch --all-namespaces -o custom-columns=KIND:.kind,NAME:.metadata.name,STATUS:.metadata.annotations.lunchpail\\.io/status,MESSAGE:.metadata.annotations.lunchpail\\.io/message &
}
