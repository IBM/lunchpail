#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/secrets.sh
. "$SCRIPTDIR"/settings.sh

"$SCRIPTDIR"/down.sh & "$SCRIPTDIR"/init.sh
wait

"$SCRIPTDIR"/build.sh

# WARNING: the silly KubeRay chart doesn't give us a good way to
# specify a namespace to use as a subchart; it will thus, for now, run
# in the default namespace

echo "$(tput setaf 2)Booting CodeFlare for arch=$ARCH$(tput sgr0)"
$HELM install $PLA platform --set global.arch=$ARCH
$HELM install $IBM watsonx_ai $HELM_SECRETS --set global.arch=$ARCH
