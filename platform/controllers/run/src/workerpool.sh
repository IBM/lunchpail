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

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

helm install --dry-run --debug $run_id "$SCRIPTDIR"/workerpool/ -n ${namespace} \
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

kubectl apply -f $DRY 1>&2
rm $DRY
