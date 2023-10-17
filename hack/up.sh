#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/secrets.sh
. "$SCRIPTDIR"/settings.sh

CODEFLARE_PREP_INIT=1 "$SCRIPTDIR"/init.sh
NO_IMAGE_PUSH=1 "$SCRIPTDIR"/build.sh &
"$SCRIPTDIR"/down.sh & "$SCRIPTDIR"/init.sh
wait

"$SCRIPTDIR"/build.sh

# WARNING: the silly KubeRay chart doesn't give us a good way to
# specify a namespace to use as a subchart; it will thus, for now, run
# in the default namespace

# For now, don't stand up the examples as part of this hack, as they
# will consume resources in a way that may block tests e.g. in Travis
# with its small workers. The dashboard UI will allow bringing these
# examples in selectively.
HAS_EXAMPLES=false

echo "$(tput setaf 2)Booting CodeFlare for arch=$ARCH$(tput sgr0)"
$HELM install $PLA platform $HELM_SECRETS --set global.arch=$ARCH --set nvidia.enabled=$HAS_NVIDIA --set tags.examples=$HAS_EXAMPLES
$HELM install $IBM watsonx_ai $HELM_SECRETS --set global.arch=$ARCH --set nvidia.enabled=$HAS_NVIDIA

# sigh, some components may use kustomize, not helm
if [[ -d "$SCRIPTDIR"/../platform/kustomize ]]
then
    for kusto in "$SCRIPTDIR"/../platform/kustomize/*.sh
    do
        ($kusto up || exit 0)
    done
fi

echo "$(tput setaf 2)Waiting for controllers to be ready$(tput sgr0)"
$KUBECTL get pod --show-kind -n codeflare-system --watch &
watch=$!
$KUBECTL wait pod -l app.kubernetes.io/part-of=codeflare.dev -n codeflare-system --for=condition=ready --timeout=-1s
$KUBECTL wait pod -l app.kubernetes.io/name=dlf -n default --for=condition=ready --timeout=-1s
$KUBECTL wait pod -l app.kubernetes.io/name=kube-fledged -n default --for=condition=ready --timeout=-1s
if [[ "$HAS_NVIDIA" = true ]]; then
    $KUBECTL wait pod -l app.kubernetes.io/managed-by=gpu-operator --for=condition=ready --timeout=-1s
fi
kill $watch 2> /dev/null

"$SCRIPTDIR"/s3-copyin.sh
