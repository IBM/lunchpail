#!/usr/bin/env bash

#
# sigh, kubeflow uses kustomize
#

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

ENV=dev
CRDS="github.com/kubeflow/pipelines/manifests/kustomize/cluster-scoped-resources?ref=$KFP_VERSION"
RSRC="github.com/kubeflow/pipelines/manifests/kustomize/env/${ENV}?ref=$PIPELINE_VERSION"

if [[ -n "$NO_KUBEFLOW" ]]; then
    echo "Skipping Kubeflow kustomize installation"
elif [[ ${1-up} = up ]]; then
    $KUBECTL apply -k $CRDS
    $KUBECTL wait --for condition=established --timeout=60s crd/applications.app.k8s.io
    $KUBECTL apply -k $RSRC
else
    $KUBECTL delete -k $RSRC --ignore-not-found
    $KUBECTL delete -k $CRDS --ignore-not-found
fi
