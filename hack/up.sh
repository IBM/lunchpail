#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh
. "$SCRIPTDIR"/secrets.sh

export DOING_UP=1

CODEFLARE_PREP_INIT=1 "$SCRIPTDIR"/init.sh
NO_IMAGE_PUSH=1 "$SCRIPTDIR"/build.sh &
"$SCRIPTDIR"/down.sh & "$SCRIPTDIR"/init.sh
wait

ONLY_IMAGE_PUSH=1 "$SCRIPTDIR"/build.sh

# WARNING: the silly KubeRay chart doesn't give us a good way to
# specify a namespace to use as a subchart; it will thus, for now, run
# in the default namespace

# prepare the helm charts
"$SCRIPTDIR"/../platform/prerender.sh

if [[ -f /tmp/kindhack.yaml ]]
then
    docker_host_ip=$(docker network inspect kind | grep Gateway | awk 'FNR==1{gsub("\"", "",$2); print $2}')
    echo "Hacking docker_host_ip=${docker_host_ip}"
    HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS --set global.dockerHost=${docker_host_ip}"
fi

echo "Creating shrinkwraps JAAS_FULL=$JAAS_FULL base-HELM_INSTALL_FLAGS=$HELM_INSTALL_FLAGS"
HELM_INSTALL_FLAGS=$HELM_INSTALL_FLAGS HELM_DEPENDENCY_DONE=1 "$SCRIPTDIR"/shrinkwrap.sh -d "$SCRIPTDIR"/shrinks

echo "$(tput setaf 2)Booting JaaS for arch=$ARCH$(tput sgr0)"
"$SCRIPTDIR"/shrinks/up

if [[ -z "$LITE" ]]
then $HELM install $IBM watsonx_ai $HELM_SECRETS --set global.arch=$ARCH --set nvidia.enabled=$HAS_NVIDIA $HELM_INSTALL_FLAGS
fi

# sigh, some components may use kustomize, not helm
if [[ -d "$SCRIPTDIR"/../platform/kustomize ]]
then
    for kusto in "$SCRIPTDIR"/../platform/kustomize/*.sh
    do
        ($kusto up || exit 0)
    done
fi

function cleanup {
    if [[ -n "$watchpid" ]]
    then kill $watchpid >& /dev/null || true
    fi
}
trap cleanup EXIT

$KUBECTL get pod --show-kind -n $NAMESPACE_SYSTEM --watch &
watchpid=$!

if [[ "$HAS_NVIDIA" = true ]]; then
    echo "$(tput setaf 2)Waiting for gpu operator to be ready$(tput sgr0)"
    $KUBECTL wait pod -l app.kubernetes.io/managed-by=gpu-operator -n $NAMESPACE_SYSTEM --for=condition=ready --timeout=-1s
fi

cleanup

"$SCRIPTDIR"/s3-copyin.sh
