#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh
. "$SCRIPTDIR"/../../hack/secrets.sh

if [[ -n $1 ]]; then
    APP="--set app=$1"
fi

if which lspci && lspci | grep -iq nvidia; then
    echo "$(tput setaf 2)Detected GPU support for arch=$ARCH$(tput sgr0)"
    GPU="--set supportsGpu=true"
fi

echo "$(tput setaf 2)Deploying test Runs for arch=$ARCH$(tput sgr0)"
$HELM install codeflare-tests "$SCRIPTDIR"/../helm $HELM_SECRETS --wait \
      $HELM_INSTALL_FLAGS \
      $HELM_IMAGE_PULL_SECRETS \
      --set global.arch=$ARCH $APP $GPU \
      --set kubernetes.context=kind-jaas \
      --set kubernetes.config=$($KUBECTL config view  -o json --flatten | base64 | tr -d "\n")
