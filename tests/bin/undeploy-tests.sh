#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

echo "$(tput setaf 2)Uninstalling test Runs for arch=$ARCH $1$(tput sgr0)"
$HELM delete --ignore-not-found codeflare-tests --wait

# in travis this can help us see whether there are straggler
# namespaces, etc.
echo "Checking for stragglers"
$KUBECTL get ns
$KUBECTL get application -A
$KUBECTL get workerpools -A
$KUBECTL get workdispatchers -A
$KUBECTL get datasets -A
echo "Done checking for stragglers"

if [[ -n "$RUNNING_CODEFLARE_TESTS" ]]
then
    while true
    do
        $KUBECTL get ns codeflare-test || break
        echo "Waiting for namespace cleanup"
        sleep 2
    done
fi
