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
$HELM install $PLA platform $HELM_SECRETS --set global.arch=$ARCH
$HELM install $IBM watsonx_ai $HELM_SECRETS --set global.arch=$ARCH

# sigh, some components use kustomize, not helm
("$SCRIPTDIR"/../platform/kustomize.sh up || exit 0)

echo "$(tput setaf 2)Waiting for controllers to be ready$(tput sgr0)"
$KUBECTL get pod --show-kind -n codeflare-system --watch &
watch=$!
$KUBECTL wait pod -l app.kubernetes.io/part-of=codeflare.dev -n codeflare-system --for=condition=ready --timeout=-1s
$KUBECTL wait pod -l app.kubernetes.io/name=dlf -n default --for=condition=ready --timeout=-1s
kill $watch 2> /dev/null

"$SCRIPTDIR"/s3-copyin.sh
