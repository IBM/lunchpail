#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

echo "$(tput setaf 2)Uninstalling test Runs for arch=$ARCH $1$(tput sgr0)"
$HELM delete codeflare-tests --wait

if [[ -n "$RUNNING_CODEFLARE_TESTS" ]]
then
    while true
    do
        $KUBECTL get ns codeflare-test || break
        echo "Waiting for namespace cleanup"
        sleep 2
    done
fi
