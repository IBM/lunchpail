#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

echo "$(tput setaf 2)Uninstalling test Runs for arch=$ARCH $1$(tput sgr0)"
$HELM delete codeflare-tests --wait
