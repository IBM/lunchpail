#!/usr/bin/env bash

set -e
set -o pipefail

# in case there are things we want to do differently knowing that we
# are running a test (e.g. to produce more predictible output);
# e.g. see 7/init.sh
export RUNNING_CODEFLARE_TESTS=1

while getopts "c:lgui:e:noprx:" opt
do
    case $opt in
        l) export HELM_INSTALL_FLAGS="--set lite=true"; export UP_FLAGS="$UP_FLAGS -l"; echo "$(tput setaf 3)🧪 Running in lite mode$(tput sgr0)"; continue;;
        e) EXCLUDE=$OPTARG; continue;;
        i) INCLUDE=$OPTARG; continue;;
        g) DEBUG=true; continue;;
        c) export UP_FLAGS="$UP_FLAGS -c $OPTARG"; continue;;
        o) export UP_FLAGS="$UP_FLAGS -o"; continue;;
        p) export UP_FLAGS="$UP_FLAGS -p"; continue;;
        r) export UP_FLAGS="$UP_FLAGS -r"; continue;;
        u) BRING_UP_CLUSTER=true; continue;;
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
    local selector=app.kubernetes.io/part-of=$name,app.kubernetes.io/component!=workdispatcher

    if [[ "$api" = ray ]]; then
        local containers="-c job-logs"
    else
        local containers="--all-containers"
    fi

    if [[ -n "$DEBUG" ]]; then set -x; fi

    # ($KUBECTL -n $ns wait pod -l $selector --for=condition=Completed --timeout=-1s && pkill $$)

    echo "$(tput setaf 2)🧪 Waiting for job to finish app=$selector ns=$ns$(tput sgr0)" 1>&2
    while true; do
        $KUBECTL -n $ns wait pod -l $selector --for=condition=Ready --timeout=5s && break || echo "$(tput setaf 5)🧪 Run not found: $selector$(tput sgr0)"

        $KUBECTL -n $ns wait pod -l $selector --for=condition=Ready=false --timeout=5s && break || echo "$(tput setaf 5)🧪 Run not found: $selector$(tput sgr0)"
        sleep 4
    done

    echo "$(tput setaf 2)🧪 Checking job output app=$selector$(tput sgr0)" 1>&2
    for done in "${dones[@]}"; do
        idx=0
        while true; do
            $KUBECTL -n $ns logs $containers -l $selector --tail=-1 | grep -E "$done" && break || echo "$(tput setaf 5)🧪 Still waiting for output $done test=$name...$(tput sgr0)"

            if [[ -n $DEBUG ]] || (( $idx > 10 )); then
                # if we can't find $done in the logs after a few
                # iterations, start printing out raw logs to help with
                # debugging
                if (( $idx < 12 ))
                then TAIL=1000
                else TAIL=10
                fi
                ($KUBECTL -n $ns logs $containers -l $selector --tail=$TAIL || exit 0)
            fi
            idx=$((idx + 1))
            sleep 4
        done
    done

    $KUBECTL delete run $name -n $ns
    echo "✅ PASS run-controller delete test=$name"

    if [[ "$api" != "workqueue" ]] || [[ ${NUM_DESIRED_OUTPUTS:-1} = 0 ]]
    then echo "✅ PASS run-controller run api=$api test=$name"
    else
        local queue=${taskqueue:-defaultjaasqueue} # TODO on default?

        echo "$(tput setaf 2)🧪 Checking output files test=$name$(tput sgr0)" 1>&2
        nOutputs=$($KUBECTL exec $($KUBECTL get pod -n $NAMESPACE_SYSTEM -l app.kubernetes.io/component=s3 -o name) -n $NAMESPACE_SYSTEM -- \
                            mc ls s3/$queue/lunchpail/$name/outbox | grep -Evs '(\.code|\.stderr|\.stdout)$' | grep -sv '/' | awk '{print $NF}' | wc -l | xargs)

        if [[ $nOutputs -ge ${NUM_DESIRED_OUTPUTS:-1} ]]
        then
            echo "✅ PASS run-controller run api=$api test=$name nOutputs=$nOutputs"
            outputs=$($KUBECTL exec $($KUBECTL get pod -n $NAMESPACE_SYSTEM -l app.kubernetes.io/component=s3 -o name) -n $NAMESPACE_SYSTEM -- \
                               mc ls s3/$queue/lunchpail/$name/outbox | grep -Evs '(\.code|\.stderr|\.stdout)$' | grep -sv '/' | awk '{print $NF}')
            echo "Outputs: $outputs"
            for output in $outputs
            do
                echo "Checking output=$output"
                code=$($KUBECTL exec $($KUBECTL get pod -n $NAMESPACE_SYSTEM -l app.kubernetes.io/component=s3 -o name) -n $NAMESPACE_SYSTEM -- \
                                mc cat s3/$queue/lunchpail/$name/outbox/${output}.code)
                if [[ $code = 0 ]] || [[ $code = -1 ]] || [[ $code = 143 ]] || [[ $code = 137 ]]
                then echo "✅ PASS run-controller test=$name output=$output code=0"
                else echo "❌ FAIL run-controller non-zero exit code test=$name output=$output code=$code" && return 1
                fi

                stdout=$($KUBECTL exec $($KUBECTL get pod -n $NAMESPACE_SYSTEM -l app.kubernetes.io/component=s3 -o name) -n $NAMESPACE_SYSTEM -- \
                                  mc ls s3/$queue/lunchpail/$name/outbox/${output}.stdout | wc -l | xargs)
                if [[ $stdout != 1 ]]
                then echo "❌ FAIL run-controller missing stdout test=$name output=$output" && return 1
                else echo "✅ PASS run-controller got stdout file test=$name output=$output"
                fi

                stderr=$($KUBECTL exec $($KUBECTL get pod -n $NAMESPACE_SYSTEM -l app.kubernetes.io/component=s3 -o name) -n $NAMESPACE_SYSTEM -- \
                                  mc ls s3/$queue/lunchpail/$name/outbox/${output}.stderr | wc -l | xargs)
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
        actualUnassignedTasks=$("$SCRIPTDIR"/../../builds/test/$name/qlast unassigned)

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
        numQueues=$("$SCRIPTDIR"/../../builds/test/$name/qlast liveworkers)
        actualNumInOutbox=$("$SCRIPTDIR"/../../builds/test/$name/qlast done)

        if [[ -z "$waitForMix" ]]
        then
            # Wait for a single value (single pool tests)
            if ! [[ $actualNumInOutbox =~ ^[0-9]+$ ]]; then echo "error: actualNumInOutbox not a number: '$actualNumInOutbox'"; fi
            if [[ "$actualNumInOutbox" != "$expectedNumInOutbox" ]]; then echo "tasks in outboxes should be ${expectedNumInOutbox} but we got ${actualNumInOutbox}"; sleep 2; else break; fi
        else
            # Wait for a mix of values (multi-pool tests). The "mix" is
            # one per worker, and we want the total to be what we
            # expect, and that each worker contributes at least one
            gotMix=$("$SCRIPTDIR"/../../builds/test/$name/qlast liveworker 4)
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

    $KUBECTL delete run $name -n $ns
    echo "✅ PASS run-controller delete test $name"
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
            $KUBECTL -n $ns get run.lunchpail.io $name --no-headers | grep -q "$status" && break || echo "$(tput setaf 5)🧪 Still waiting for Failed: $name$(tput sgr0)"
            ($KUBECTL -n $ns get run.lunchpail.io $name --show-kind --no-headers | grep $name || exit 0)
            sleep 4
        done
    done

    echo "✅ PASS run-controller run test $name"

    $KUBECTL delete run $name -n $ns
    echo "✅ PASS run-controller delete test $name"
}

function deploy {
    "$SCRIPTDIR"/deploy-tests.sh $@
}

function undeploy {
    if [[ -n "$2" ]]
    then kill $2 || true
    fi

    ("$SCRIPTDIR"/undeploy-tests.sh $1 || exit 0)
}

function watch {
    if [[ -n "$CI" ]]; then
        $KUBECTL get appwrapper --show-kind -n $NAMESPACE_USER -o custom-columns=NAME:.metadata.name,CONDITIONS:.status.conditions --watch &
        $KUBECTL get pod --show-kind -n $NAMESPACE_USER --watch &
    fi
    $KUBECTL get pod --show-kind -n $NAMESPACE_SYSTEM --watch &
    $KUBECTL get run --show-kind --all-namespaces --watch &
    $KUBECTL get workerpool --watch --all-namespaces -o custom-columns=KIND:.kind,NAME:.metadata.name,STATUS:.metadata.annotations.lunchpail\\.io/status,MESSAGE:.metadata.annotations.lunchpail\\.io/message &
}
