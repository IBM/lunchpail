#!/usr/bin/env bash

set -e
set -o pipefail
set -o allexport

SETTINGS_SCRIPTDIR="$( dirname -- "$BASH_SOURCE"; )"

###########################################################################################
#
# Here are the configurable settings:
#
LUNCHPAIL=lunchpail                                         # name of product, used in s3 paths, etc.

IMAGE_REGISTRY=${IMAGE_REGISTRY:-ghcr.io}                   # image registry part of image url
IMAGE_REPO=${IMAGE_REPO:-$LUNCHPAIL}                        # image repo part of image url
VERSION=${VERSION:-$("$SETTINGS_SCRIPTDIR"/version.sh)}     # image tag part of image url
CLUSTER_NAME=${CLUSTER_NAME:-jaas}                          # name of kubernetes cluster
CLUSTER_TYPE=${CLUSTER_TYPE:-k8s}                           # k8s|oc -- use oc for OpenShift, which will set sccs for Datashim

CONTEXT_NAME=${CONTEXT_NAME:-kind-${CLUSTER_NAME}}          # i.e. kubectl --context $CONTEXT_NAME, defaults to kind-$CLUSTER_NAME e.g. kind-jaas

NAMESPACE_SUFFIX=""                                                           # suffix to add to namespace names
NAMESPACE_USER=${NAMESPACE_USER:-jaas-user$NAMESPACE_SUFFIX}                  # namespace to use for user resources
NAMESPACE_SYSTEM=${NAMESPACE_SYSTEM:-${CLUSTER_NAME}-system$NAMESPACE_SUFFIX} # namespace to use for system resources

NEEDS_CSI_S3=${NEEDS_CSI_S3:-false}
NEEDS_CSI_H3=${NEEDS_CSI_H3:-false}
NEEDS_CSI_NFS=${NEEDS_CSI_NFS:-false}

NEEDS_GANG_SCHEDULING=${NEEDS_GANG_SCHEDULING:-false}
###########################################################################################

if [[ -z "$NO_GETOPTS" ]]
then
    while getopts "c:ltk:noprs" opt
    do
        case $opt in
            n) export NO_BUILD=1; continue;;
            c) export CONTEXT_NAME=$OPTARG; continue;;
            l) echo "Running up in lite mode"; export LITE=1; export JAAS_FULL=false; export HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS $HELM_INSTALL_LITE_FLAGS"; continue;;
            t) export RUNNING_TESTS=true; continue;;
            k) NO_KIND=true; export KUBECONFIG=${OPTARG}; continue;;
            o) export CLUSTER_TYPE=oc; continue;;
            p) export PROD=true; continue;;
            r) RUN_AS_ROOT=true; continue;;
            s) SUDO=sudo; continue;;
        esac
    done
    shift $((OPTIND-1))
fi

IBM=$(grep name "$SETTINGS_SCRIPTDIR"/../watsonx_ai/Chart.yaml | awk '{print $2}' | head -1)

ARCH=${ARCH-$(uname -m)}

# Note: a trailing slash is required, if this is non-empty
IMAGE_REPO_FOR_BUILD=$IMAGE_REGISTRY/$IMAGE_REPO/

HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS --set jaas-core.lunchpail=$LUNCHPAIL --set global.jaas.namespace.name=$NAMESPACE_SYSTEM --set jaas-default-user.namespace.user=$NAMESPACE_USER --set global.jaas.context.name=$CONTEXT_NAME --set global.image.registry=$IMAGE_REGISTRY --set global.image.repo=$IMAGE_REPO --set global.image.version=$VERSION --set dlf-chart.csi-h3-chart.enabled=$NEEDS_CSI_H3 --set dlf-chart.csi-s3-chart.enabled=$NEEDS_CSI_S3 --set dlf-chart.csi-nfs-chart.enabled=$NEEDS_CSI_NFS --set global.jaas.gangScheduling=$NEEDS_GANG_SCHEDULING --set gangScheduling.enabled=$NEEDS_GANG_SCHEDULING --set global.type=$CLUSTER_TYPE --set global.rbac.serviceaccount=${CLUSTER_NAME} --set global.rbac.runAsRoot=${RUN_AS_ROOT:-false}"

# this will limit the platform to just api=workqueue
HELM_INSTALL_LITE_FLAGS="--set global.lite=true --set tags.default-user=false --set tags.defaults=false --set tags.full=false --set tags.core=true"

if lspci 2> /dev/null | grep -iq nvidia
then HAS_NVIDIA=true
else HAS_NVIDIA=false
fi

# Note: a trailing slash is required, if this is non-empty
IMAGE_REPO_FOR_BUILD=$IMAGE_REGISTRY/$IMAGE_REPO/

HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS --set global.jaas.namespace.name=$NAMESPACE_SYSTEM --set global.jaas.context.name=$CONTEXT_NAME --set global.image.registry=$IMAGE_REGISTRY --set global.image.repo=$IMAGE_REPO --set global.image.version=$VERSION --set tags.gpu=$HAS_NVIDIA"

# this will limit the platform to just api=workqueue
HELM_INSTALL_LITE_FLAGS="--set global.lite=true --set tags.default-user=false --set tags.defaults=false --set tags.full=false --set tags.core=true --set tags.gpu=false"

export KUBECTL="$SUDO $(which kubectl || echo /usr/local/bin/kubectl) --context $CONTEXT_NAME"
export HELM_DEPENDENCY="$(which helm || echo /usr/local/bin/helm) --kube-context $CONTEXT_NAME dependency"
export HELM_TEMPLATE="$(which helm || echo /usr/local/bin/helm) --kube-context $CONTEXT_NAME template"
export HELM="$SUDO $(which helm || echo /usr/local/bin/helm) --kube-context $CONTEXT_NAME"
export KIND="$SUDO $(which kind || echo /usr/local/bin/kind)"

# deploy ray, spark, etc. support?
export JAAS_FULL=${JAAS_FULL:-true}
