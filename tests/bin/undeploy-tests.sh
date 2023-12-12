#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

# in travis this can help us see whether there are straggler
# namespaces, etc.
function report_stragglers {
    echo "Checking for straggler NAMESPACES"
    $KUBECTL get ns

    echo "Checking for straggler PODS"
    $KUBECTL get pod -n codeflare-test

    echo "Checking for straggler APPLICATIONS"
    $KUBECTL get application -n codeflare-test
    
    echo "Checking for straggler WORKERPOOLS"
    $KUBECTL get workerpools -n codeflare-test

    echo "Checking for straggler WORKDISPATCHERS"
    $KUBECTL get workdispatchers -n codeflare-test

    echo "Checking for straggler DATASETS"
    $KUBECTL get datasets -n codeflare-test

    echo "Run controller logs"
    TAIL=1000 "$SCRIPTDIR"/../../hack/logs/run.sh

    echo "codeflare-test pod logs"
    $KUBECTL logs -n codeflare-test -l app.kubernetes.io/managed-by=codeflare.dev

    echo "codeflare-test events"
    $KUBECTL get events -n codeflare-test
    
    # since we are only here if there was a failure
    return 1
}

# retry once after failure; this may help to cope with `etcdserver:
# request timed out` errors
echo "$(tput setaf 2)Uninstalling test Runs for arch=$ARCH $1$(tput sgr0)"
$HELM delete --ignore-not-found codeflare-tests --wait || \
    report_stragglers || \
    $HELM delete --ignore-not-found codeflare-tests --wait || \
    report_stragglers

if [[ -n "$RUNNING_CODEFLARE_TESTS" ]]
then
    while true
    do
        $KUBECTL get ns codeflare-test || break
        echo "Waiting for namespace cleanup"
        sleep 2
    done
fi
