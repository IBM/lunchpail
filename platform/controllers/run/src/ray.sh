#!/usr/bin/env bash

set -x
set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

name="$1"
namespace="$2"
run_id="$3"
image="$4"
entrypoint="$5"
subPath="$6"
nWorkers="$7"
cpu="$8"
memory="$9"
gpu="${10}"
runtimeEnv="${11}"
#requirements="${12}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY"

# Fire off a `kubectl wait` which will return when the job we are
# about to launch is running. Below, we will do a `wait` that
# subprocess. We need to launch this first, before doing the `kubectl
# apply` to avoid a race window.
kubectl wait pod -l app.kubernetes.io/instance=$run_id --for=condition=Running --timeout=-1s &

helm install --dry-run $run_id "$SCRIPTDIR"/ray/ -n ${namespace} \
     --set kind=job \
     --set name=$name \
     --set image=$image \
     --set namespace=$namespace \
     --set entrypoint="$entrypoint" \
     --set subPath=$subPath \
     --set workers.count=$nWorkers \
     --set workers.cpu=$cpu \
     --set workers.memory=$memory \
     --set workers.gpu=$gpu \
     --set runtimeEnv=$runtimeEnv \
     --set workdir.clusterIP=$WORKDIR_SERVER \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

kubectl apply -f $DRY
# rm $DRY

# Get and emit the head pod name; it will be the "return value" of
# this script. Take care not to emit anything else on stdout in this
# script!
#HEAD=$(kubectl get pod -l app.kubernetes.io/instance=$run_id,torchx.pytorch.org/replica-id=0,torchx.pytorch.org/role-index=0 --no-headers -o custom-columns=NAME:.metadata.name)
#echo $HEAD

# Wait for the job to be running. See the `kubectl wait` above. Here,
# we are bash-waiting on that kubectl await!
wait
