#!/usr/bin/env bash

set -x
set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

uid="$1"
name="$2"
namespace="$3"
run_id="$4"
image="$5"
command="$6"
subPath="$7"
application_name="$8"
queue_dataset="$9"
count="${10}"
cpu="${11}"
memory="${12}"
gpu="${13}"
datasets="${14}"
kubecontext="${15}"
kubeconfig="${16}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

if [[ -n "$kubecontext" ]]
then kubecontext_option="--kube-context $kubecontext"
fi

if [[ -n "$kubeconfig" ]]
then
    kubeconfig_path=$(mktemp)
    echo -n "$kubeconfig" | base64 -d > ${kubeconfig_path}
    kubeconfig_option="--kubeconfig ${kubeconfig_path} --kube-insecure-skip-tls-verify"
fi

helm install --dry-run --debug $run_id "$SCRIPTDIR"/workerpool/ -n ${namespace} ${kubecontext_option} ${kubeconfig_option} \
     --set uid=$uid \
     --set name=$name \
     --set image=$image \
     --set namespace=$namespace \
     --set command="$command" \
     --set subPath=$subPath \
     --set partOf=$application_name \
     --set workers.count=$count \
     --set workers.cpu=$cpu \
     --set workers.memory=$memory \
     --set workers.gpu=$gpu \
     --set workdir.clusterIP=$WORKDIR_SERVER \
     --set queue.dataset=$queue_dataset \
     --set datasets=$datasets \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

# we could pipe the helm install to kubectl apply; leaving them
# separate now to aid with debugging
kubectl apply -f $DRY 1>&2
rm -f $DRY

if [[ -f "$kubeconfig_path" ]]
then rm -f "$kubeconfig_path"
fi
