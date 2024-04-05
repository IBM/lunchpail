#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../../
. "$TOP"/hack/settings.sh

# in travis this can help us see whether there are straggler
# namespaces, etc.
function report_stragglers {
    set +e

    echo "Checking for straggler NAMESPACES"
    $KUBECTL get ns

    echo "Checking for straggler PODS"
    $KUBECTL get pod -n $NAMESPACE_USER

    echo "Checking for straggler PODS details"
    $KUBECTL get pod -n $NAMESPACE_USER -o yaml
    
    echo "Checking for straggler APPLICATIONS"
    $KUBECTL get application -n $NAMESPACE_USER
    
    echo "Checking for straggler WORKERPOOLS"
    $KUBECTL get workerpools -n $NAMESPACE_USER

    echo "Checking for straggler WORKDISPATCHERS"
    $KUBECTL get workdispatchers -n $NAMESPACE_USER

    echo "Checking for straggler DATASETS"
    $KUBECTL get datasets -n $NAMESPACE_USER

    echo "$NAMESPACE_USER pod logs"
    $KUBECTL logs -n $NAMESPACE_USER -l app.kubernetes.io/managed-by=lunchpail.io

    echo "$NAMESPACE_USER events"
    $KUBECTL get events -n $NAMESPACE_USER
    
    echo "Run controller logs"
    TAIL=1000 "$TOP"/hack/logs/run.sh

    # since we are only here if there was a failure
    return 1
}

# retry once after failure; this may help to cope with `etcdserver:
# request timed out` errors
echo "$(tput setaf 2)Uninstalling test Runs for arch=$ARCH $1$(tput sgr0)"

# Undeploy prior test installations. Here we sort by last modified
# time `ls -t`, so that we undeploy the most recently modified
# shrinkwraps first
for dir in $(ls -t "$TOP"/builds/test)
do
    "$TOP"/builds/test/"$dir"/down

    # in CI, we can speed things up by only undeploying the latest
    # (i.e. the test we just ran)
    if [[ -n "$CI" ]]
    then break
    fi
done

if [[ -n "$RUNNING_CODEFLARE_TESTS" ]]
then
    while true
    do
        $KUBECTL get ns $NAMESPACE_USER || break
        echo "Waiting for namespace cleanup"
        sleep 2
    done
fi

echo "$(tput setaf 2)Done uninstalling test Runs for arch=$ARCH $1$(tput sgr0)"
