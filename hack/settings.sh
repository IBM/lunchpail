#!/usr/bin/env bash

set -e
set -o pipefail

SETTINGS_SCRIPTDIR="$( dirname -- "$BASH_SOURCE"; )"


###########################################################################################
#
# Here are the configurable settings:
#
IMAGE_REGISTRY=${IMAGE_REGISTRY:-ghcr.io}                   # image registry part of image url
IMAGE_REPO=${IMAGE_REPO:-project-codeflare}                 # image repo part of image url
VERSION=${VERSION:-$("$SETTINGS_SCRIPTDIR"/version.sh)}     # image tag part of image url
CLUSTER_NAME=${CLUSTER_NAME:-jaas}                          # name of kubernetes cluster
CLUSTER_TYPE=${CLUSTER_TYPE:-k8s}                           # k8s|oc -- use oc for OpenShift, which will set sccs for Datashim

NAMESPACE_SUFFIX=${NAMESPACE_SUFFIX:--$(whoami)}                              # suffix to add to namespace names
NAMESPACE_USER=${NAMESPACE_USER:-jaas-user$NAMESPACE_SUFFIX}                  # namespace to use for user resources
NAMESPACE_SYSTEM=${NAMESPACE_SYSTEM:-${CLUSTER_NAME}-system$NAMESPACE_SUFFIX} # namespace to use for system resources

NEEDS_CSI_H3=${NEEDS_CSI_H3:-false}
NEEDS_CSI_NFS=${NEEDS_CSI_NFS:-false}

NEEDS_GANG_SCHEDULING=${NEEDS_GANG_SCHEDULING:-false}

###########################################################################################


PLA=$(grep name "$SETTINGS_SCRIPTDIR"/../platform/Chart.yaml | awk '{print $2}' | head -1)
IBM=$(grep name "$SETTINGS_SCRIPTDIR"/../watsonx_ai/Chart.yaml | awk '{print $2}' | head -1)

ARCH=${ARCH-$(uname -m)}
export KFP_VERSION=2.0.0

# Note: a trailing slash is required, if this is non-empty
IMAGE_REPO_FOR_BUILD=$IMAGE_REGISTRY/$IMAGE_REPO/

HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS --set global.jaas.namespace.name=$NAMESPACE_SYSTEM --set jaas-default-user.namespace.user=$NAMESPACE_USER --set global.jaas.context.name=kind-$CLUSTER_NAME --set global.image.registry=$IMAGE_REGISTRY --set global.image.repo=$IMAGE_REPO --set global.image.version=$VERSION --set dlf-chart.csi-h3-chart.enabled=$NEEDS_CSI_H3 --set dlf-chart.csi-nfs-chart.enabled=$NEEDS_CSI_NFS --set global.jaas.gangScheduling=$NEEDS_GANG_SCHEDULING --set gangScheduling.enabled=$NEEDS_GANG_SCHEDULING --set global.type=$CLUSTER_TYPE --set global.rbac.serviceaccount=${CLUSTER_NAME}"

# this will limit the platform to just api=workqueue
HELM_INSTALL_LITE_FLAGS="--set global.lite=true --set tags.default-user=false --set tags.defaults=false --set tags.full=false --set tags.core=true"

if lspci 2> /dev/null | grep -iq nvidia
then HAS_NVIDIA=true
else HAS_NVIDIA=false
fi

# Note: a trailing slash is required, if this is non-empty
IMAGE_REPO_FOR_BUILD=$IMAGE_REGISTRY/$IMAGE_REPO/

HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS --set global.jaas.namespace.name=$NAMESPACE_SYSTEM --set global.jaas.context.name=kind-$CLUSTER_NAME --set global.image.registry=$IMAGE_REGISTRY --set global.image.repo=$IMAGE_REPO --set global.image.version=$VERSION --set tags.gpu=$HAS_NVIDIA"

# this will limit the platform to just api=workqueue
HELM_INSTALL_LITE_FLAGS="--set global.lite=true --set tags.default-user=false --set tags.defaults=false --set tags.full=false --set tags.core=true --set tags.gpu=false"

export KUBECTL="kubectl --context kind-${CLUSTER_NAME}"
export HELM="helm --kube-context kind-${CLUSTER_NAME}"

# deploy ray, spark, etc. support?
export JAAS_FULL=${JAAS_FULL:-true}

if [[ -z "$NO_GETOPTS" ]]
then
    while getopts "ltk:p" opt
    do
        case $opt in
            l) echo "Running up in lite mode"; export NO_KUBEFLOW=1; export LITE=1; export JAAS_FULL=false; export HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS $HELM_INSTALL_LITE_FLAGS"; continue;;
            t) RUNNING_TESTS=true; continue;;
            k) NO_KIND=true; export KUBECONFIG=${OPTARG}; continue;;
            p) PROD=true; continue;;
        esac
    done
    shift $((OPTIND-1))
fi
