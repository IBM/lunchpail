#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/secrets.sh
. "$SCRIPTDIR"/../../hack/settings.sh

if [[ -n $1 ]]; then
    APP="--set app=$1"
fi

if lspci | grep -iq nvidia; then
    echo "$(tput setaf 2)Detected GPU support for arch=$ARCH$(tput sgr0)"
    GPU="--set supportsGpu=true"
fi

echo "$(tput setaf 2)Deploying test Runs for arch=$ARCH$(tput sgr0)"
$HELM install codeflare-tests tests $HELM_SECRETS --set global.arch=$ARCH $APP $GPU

$KUBECTL get run --all-namespaces --watch
