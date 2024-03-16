#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

# in travis this can help us see whether there are straggler
# namespaces, etc.
function report_stragglers {
    set +e

    echo "Checking for straggler NAMESPACES"
    $KUBECTL get ns

    echo "Checking for straggler PODS"
    $KUBECTL get pod -n $CLUSTER_NAME-test

    echo "Checking for straggler PODS details"
    $KUBECTL get pod -n $CLUSTER_NAME-test -o yaml
    
    echo "Checking for straggler APPLICATIONS"
    $KUBECTL get application -n $CLUSTER_NAME-test
    
    echo "Checking for straggler WORKERPOOLS"
    $KUBECTL get workerpools -n $CLUSTER_NAME-test

    echo "Checking for straggler WORKDISPATCHERS"
    $KUBECTL get workdispatchers -n $CLUSTER_NAME-test

    echo "Checking for straggler DATASETS"
    $KUBECTL get datasets -n $CLUSTER_NAME-test

    echo "$CLUSTER_NAME-test pod logs"
    $KUBECTL logs -n $CLUSTER_NAME-test -l app.kubernetes.io/managed-by=codeflare.dev

    echo "$CLUSTER_NAME-test events"
    $KUBECTL get events -n $CLUSTER_NAME-test
    
    echo "Run controller logs"
    TAIL=1000 "$SCRIPTDIR"/../../hack/logs/run.sh

    # since we are only here if there was a failure
    return 1
}

# retry once after failure; this may help to cope with `etcdserver:
# request timed out` errors
echo "$(tput setaf 2)Uninstalling test Runs for arch=$ARCH $1$(tput sgr0)"
$HELM delete --ignore-not-found $CLUSTER_NAME-tests --wait || \
    report_stragglers || \
    $HELM delete --ignore-not-found $CLUSTER_NAME-tests --wait || \
    report_stragglers

if [[ -n "$RUNNING_CODEFLARE_TESTS" ]]
then
    while true
    do
        $KUBECTL get ns $CLUSTER_NAME-test || break
        echo "Waiting for namespace cleanup"
        sleep 2
    done
fi

echo "$(tput setaf 2)Done uninstalling test Runs for arch=$ARCH $1$(tput sgr0)"
