#!/usr/bin/env bash

set -e
set -o pipefail

export RUNNING_CODEFLARE_TESTS=1

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
    local dones="$3"

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
    for done in "${dones[@]}"; do
        idx=0
        while true; do
            $KUBECTL -n $ns logs $containers -l $selector --tail=-1 | grep "$done" && break || echo "$(tput setaf 5)🧪 Still waiting for output $done... $selector$(tput sgr0)"

            if [[ -n $DEBUG ]] || (( $idx > 10 )); then
                # if we can't find $done in the logs after a few
                # iterations, start printing out raw logs to help with
                # debugging
                ($KUBECTL -n $ns logs $containers -l $selector --tail=4 || exit 0)
            fi
            idx=$((idx + 1))
            sleep 4
        done
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

# api=workqueue
#deploy test7 & D=$!
#"$SCRIPTDIR"/7/init.sh 1 3 2 test7
#waitForIt test7 codeflare-test ('Processing /queue/0/inbox/task.1.txt' 'Processing /queue/0/inbox/task.3.txt' 'Processing /queue/0/inbox/task.5.txt' 'Processing /queue/1/inbox/task.2.txt' 'Processing /queue/1/inbox/task.4.txt' 'Processing /queue/1/inbox/task.6.txt')
#undeploy test7 $D

# test app not found
deploy test0 & D=$!
expected=('Failed')
waitForStatus test0 codeflare-test "${expected[@]}"
undeploy test0 $D

# torch with dataset
deploy test1 & D=$!
expected=('PASS: datashim outer mount is a directory' 'PASS: datashim mount of s3-test is a directory')
waitForIt test1 codeflare-test "${expected[@]}"
undeploy test1 $D

# ray with dataset
deploy test2 & D=$!
expected=('PASS: datashim outer mount is a directory' 'PASS: datashim mount of s3-test is a directory')
waitForIt test2 codeflare-test "${expected[@]}" ray
undeploy test2 $D

# kubeflow no dataset
if [[ -z "$NO_KUBEFLOW" ]]; then
    deploy test3 & D=$!
    expected=('Run is finished with state SUCCEEDED')
    waitForIt test3 codeflare-test "${expected[@]}"
    undeploy test3 $D
fi

# sequence no datasets or app overrides
deploy test4 & D=$!
expected=('Sequence exited with 0')
waitForIt test4 codeflare-test "${expected[@]}"
undeploy test4 $D

# simple gpu test
if lspci | grep -iq nvidia; then
    deploy test5 & D=$!
    expected=('Test PASSED')
    waitForIt test5 codeflare-test "${expected[@]}"
    undeploy test5 $D
fi

# api=shell no datasets
deploy test6 & D=$!
expected=('PASS: Shell Application test6 idx=0 x="xxxx" rest="yyyy zzzz"')
waitForIt test6 codeflare-test "${expected[@]}"
undeploy test6 $D

# api=spark no datasets
deploy test8 & D=$!
expected=('Pi is roughly 3')
waitForIt test8 codeflare-test "${expected[@]}"
undeploy test8 $D

# api=spark with dataset
deploy test9 & D=$!
expected=('Pi is roughly 3' 'PASS: datashim outer mount is a directory' 'PASS: datashim mount of s3-test is a directory')
waitForIt test9 codeflare-test "${expected[@]}"
undeploy test9 $D

# hap test
#if [[ -z $CI ]]; then
# for now, only test this locally. we don't have hap data working in travis, yet
# expected=('estimated_memory_footprint')
#    waitForIt hap-test codeflare-watsonxai-preprocessing "${expected[@]}"
#fi

# basic torch and ray tests
("$SCRIPTDIR"/deploy-tests.sh examples || exit 0) &
expected=('Trainable params')
waitForIt lightning codeflare-watsonxai-examples "${expected[@]}" # torch
expected=('eigenvalue')
waitForIt qiskit codeflare-watsonxai-examples "${expected[@]}" ray # ray
("$SCRIPTDIR"/undeploy-tests.sh examples || exit 0)

echo "Test runs complete"
exit 0
