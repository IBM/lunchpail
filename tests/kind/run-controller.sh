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
    local selector=$2
    local ns=$3
    local done="$4"

    if [[ -n "$DEBUG" ]]; then set -x; fi

    # ($KUBECTL -n $ns wait pod -l $selector --for=condition=Completed --timeout=-1s && pkill $$)

    echo "$(tput setaf 2)🧪 Waiting for job to finish app=$selector ns=$ns$(tput sgr0)" 1>&2
    while true; do
        $KUBECTL -n $ns wait pod -l $selector --for=condition=Ready --timeout=5s && break || echo "$(tput setaf 5)🧪 Run not found: $selector$(tput sgr0)"

        $KUBECTL -n $ns wait pod -l $selector --for=condition=Ready=false --timeout=5s && break || echo "$(tput setaf 5)🧪 Run not found: $selector$(tput sgr0)"
        sleep 4
    done

    echo "$(tput setaf 2)🧪 Checking job output app=$selector$(tput sgr0)" 1>&2
    while true; do
        $KUBECTL -n $ns logs --all-containers -l $selector --tail=-1 | grep "$done" && break || echo "$(tput setaf 5)🧪 Still waiting... $selector$(tput sgr0)"

        if [[ -n $DEBUG ]]; then
            $KUBECTL -n $ns logs --all-containers -l $selector --tail=4 # print out the last few lines to help with debugging
        fi
        sleep 4
    done

    echo "✅ PASS run-controller run test $selector"

    $KUBECTL delete run $name -n $ns
    echo "✅ PASS run-controller delete test $selector"
}

("$SCRIPTDIR"/undeploy-tests.sh || exit 0)
up
"$SCRIPTDIR"/deploy-tests.sh &
$KUBECTL get pod --show-kind -n codeflare-system --watch &
waitForIt lightning app.kubernetes.io/name=lightning codeflare-watsonxai-examples 'Trainable params'
waitForIt qiskit app.kubernetes.io/name=kuberay codeflare-watsonxai-examples 'eigenvalue'

# dataset tests; TODO move somewhere else?
waitForIt test1 app.kubernetes.io/name=test1 codeflare-test 'PASS'
waitForIt test2 app.kubernetes.io/name=kuberay codeflare-test 'PASS'

("$SCRIPTDIR"/undeploy-tests.sh || exit 0)
