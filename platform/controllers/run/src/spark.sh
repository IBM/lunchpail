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
type="$8"
mainFile="$9"
subPath="${10}"
nWorkers="${11}"
cpu="${12}"
memory="${13}"
gpu="${14}"
datasets="${15}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

# Fire off a `kubectl wait` which will return when the job we are
# about to launch is running. Below, we will do a `wait` that
# subprocess. We need to launch this first, before doing the `kubectl
# apply` to avoid a race window.
# (while true; do kubectl wait pod -l app.kubernetes.io/instance=$run_id --for=condition=Ready --timeout=-1s -n $namespace >& /dev/null && break; sleep 1; done) &

helm install --dry-run --debug $run_id "$SCRIPTDIR"/spark/ -n ${namespace} \
     --set kind=job \
     --set uid=$uid \
     --set name=$name \
     --set partOf=$part_of \
     --set enclosingStep=$step \
     --set image=$image \
     --set namespace=$namespace \
     --set type="$type" \
     --set mainFile="$mainFile" \
     --set subPath=$subPath \
     --set workers.count=$nWorkers \
     --set workers.cpu=$cpu \
     --set workers.memory=$memory \
     --set workers.gpu=$gpu \
     --set workdir.pvc=$WORKDIR_PVC \
     --set datasets=$datasets \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

kubectl apply -f $DRY 1>&2
#rm $DRY
