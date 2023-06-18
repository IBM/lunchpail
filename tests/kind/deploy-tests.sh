#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/secrets.sh
. "$SCRIPTDIR"/../../hack/settings.sh

echo "$(tput setaf 2)Deploying test Runs for arch=$ARCH$(tput sgr0)"
$HELM install codeflare-tests tests $HELM_SECRETS --set global.arch=$ARCH

$KUBECTL get run --all-namespaces --watch
