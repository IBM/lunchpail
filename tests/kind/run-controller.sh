#!/usr/bin/env bash

set -e
set -o pipefail

while getopts "gu" opt
do
    case $opt in
        g) DEBUG=true; continue;;
        u) BRING_UP_CLUSTER=true; continue;;
    esac
done
shift $((OPTIND-1))

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

function up {
    local MAIN_SCRIPTDIR=$(cd $(dirname "$0") && pwd)
    "$MAIN_SCRIPTDIR"/../../hack/up.sh -t # -t says don't watch, just return when you are done
}

function waitForIt {
    local name=$1
    local selector=app.kubernetes.io/part-of=$name
    local ns=$2
    local done="$3"

    if [[ "$4" = ray ]]; then
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
    idx=0
    while true; do
        $KUBECTL -n $ns logs $containers -l $selector --tail=-1 | grep "$done" && break || echo "$(tput setaf 5)🧪 Still waiting for output... $selector$(tput sgr0)"

        if [[ -n $DEBUG ]] || (( $idx > 10 )); then
            ($KUBECTL -n $ns logs $containers -l $selector --tail=4 || exit 0) # print out the last few lines to help with debugging
        fi
        idx=$((idx + 1))
        sleep 4
    done

    echo "✅ PASS run-controller run test $selector"

    $KUBECTL delete run $name -n $ns
    echo "✅ PASS run-controller delete test $selector"
}

function waitForStatus {
    local name=$1
    local ns=$2
    local status=$3

    if [[ -n "$DEBUG" ]]; then set -x; fi

    echo "$(tput setaf 2)🧪 Waiting for job to finish app=$selector ns=$ns$(tput sgr0)" 1>&2
    while true; do
        $KUBECTL -n $ns get run.codeflare.dev $name --no-headers | grep -q $status && break || echo "$(tput setaf 5)🧪 Still waiting for Failed: $name$(tput sgr0)"
        ($KUBECTL -n $ns get run.codeflare.dev $name --no-headers | grep $name || exit 0)
        sleep 4
    done

    echo "✅ PASS run-controller run test $name"

    $KUBECTL delete run $name -n $ns
    echo "✅ PASS run-controller delete test $name"
}

function deploy {
    "$SCRIPTDIR"/deploy-tests.sh $1 || exit 0
}

function undeploy {
    [[ -n "$2" ]] && kill $2
    ("$SCRIPTDIR"/undeploy-tests.sh $1 || exit 0)
}

undeploy
up

if [[ -n "$CI" ]]; then
    $KUBECTL get appwrapper -n codeflare-test -o custom-columns=NAME:.metadata.name,CONDITIONS:.status.conditions --watch &
    $KUBECTL get pod --show-kind -n codeflare-test --watch &
fi
$KUBECTL get pod --show-kind -n codeflare-system --watch &

deploy test0 & D=$!
waitForStatus test0 codeflare-test 'Failed' # test app not found
undeploy test0 $D

deploy test1 & D=$!
waitForIt test1 codeflare-test 'PASS' # torch dataset
undeploy test1 $D

deploy test2 & D=$!
waitForIt test2 codeflare-test 'PASS' ray # ray dataset
undeploy test2 $D

deploy test3 & D=$!
waitForIt test3 codeflare-test 'Run is finished with state SUCCEEDED' # kubeflow no dataset
undeploy test3 $D

deploy test4 & D=$!
waitForIt test4 codeflare-test 'Sequence exited with 0' # sequence no datasets or app overrides
undeploy test4 $D

# hap test
#if [[ -z $CI ]]; then
    # for now, only test this locally. we don't have hap data working in travis, yet
#    waitForIt hap-test codeflare-watsonxai-preprocessing 'estimated_memory_footprint'
#fi

# basic torch and ray tests
("$SCRIPTDIR"/deploy-tests.sh examples || exit 0) &
waitForIt lightning codeflare-watsonxai-examples 'Trainable params' # torch
waitForIt qiskit codeflare-watsonxai-examples 'eigenvalue' ray # ray
("$SCRIPTDIR"/undeploy-tests.sh examples || exit 0)
