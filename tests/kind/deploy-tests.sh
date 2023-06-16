#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

echo "$(tput setaf 2)Deploying test Runs for arch=$ARCH$(tput sgr0)"
$KUBECTL apply --recursive -f tests/runs

$KUBECTL get run -n codeflare-watsonxai-examples --watch
