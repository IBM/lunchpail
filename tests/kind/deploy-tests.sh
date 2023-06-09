#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

echo "$(tput setaf 2)Deploying test Runs for arch=$ARCH$(tput sgr0)"
$HELM install $RUN tests/run --set global.arch=$ARCH
