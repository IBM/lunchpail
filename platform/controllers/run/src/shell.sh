#!/usr/bin/env bash

set -x
set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

uid="$1"
name="$2"
namespace="$3"
part_of="$4"
step="$5" # if part of enclosing sequence
run_id="$6"
image="$7"
command="$8"
subPath="$9"
nWorkers="${10}"
cpu="${11}"
memory="${12}"
gpu="${13}"
env="${14}"
dataset_labels="${15}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

helm install --dry-run --debug $run_id "$SCRIPTDIR"/shell/ -n ${namespace} \
     --set kind=job \
     --set uid=$uid \
     --set name=$name \
     --set partOf=$part_of \
     --set enclosingStep=$step \
     --set image=$image \
     --set namespace=$namespace \
     --set command="$command" \
     --set subPath=$subPath \
     --set workers.count=$nWorkers \
     --set workers.cpu=$cpu \
     --set workers.memory=$memory \
     --set workers.gpu=$gpu \
     --set env="$env" \
     --set workdir.pvc=$WORKDIR_PVC \
     --set datasets=$dataset_labels \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

kubectl apply -f $DRY 1>&2
#rm $DRY
