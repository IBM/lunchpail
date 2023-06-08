#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

PLA=$(grep name "$SCRIPTDIR"/../platform/Chart.yaml | awk '{print $2}')
IBM=$(grep name "$SCRIPTDIR"/../watsonx_ai/Chart.yaml | awk '{print $2}')
RUN=$(grep name "$SCRIPTDIR"/../tests/run/Chart.yaml | awk '{print $2}')

ARCH=${ARCH-$(uname -m)}

# for local testing
CLUSTER_NAME=${CLUSTER_NAME-codeflare-platform}

export KUBECTL="kubectl --context kind-${CLUSTER_NAME}"
export HELM="helm --kube-context kind-${CLUSTER_NAME}"

while getopts "k:" opt
do
    case $opt in
        k) NO_KIND=true; export KUBECONFIG=${OPTARG}; continue;;
    esac
done
shift $((OPTIND-1))

if [[ -z "$NO_KIND" ]]; then
    VERSION=dev
else
    VERSION=0.0.1 # FIXME
    # IMAGE_REPO= # FIXME
fi


