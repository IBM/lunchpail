#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/secrets.sh
. "$SCRIPTDIR"/../../hack/settings.sh

if [[ -n $1 ]]; then
    APP="--set app=$1"
fi

if which lspci && lspci | grep -iq nvidia; then
    echo "$(tput setaf 2)Detected GPU support for arch=$ARCH$(tput sgr0)"
    GPU="--set supportsGpu=true"
fi

echo "$(tput setaf 2)Deploying test Runs for arch=$ARCH$(tput sgr0)"
$HELM install codeflare-tests "$SCRIPTDIR"/../helm $HELM_SECRETS --wait --set global.arch=$ARCH $APP $GPU \
      --set kubernetes.context=kind-jaas \
      --set kubernetes.config=$($KUBECTL config view  -o json --flatten | sed 's/127\.0\.0\.1/host.docker.internal/g' | base64 | tr -d "\n")

$KUBECTL get run --all-namespaces --watch
