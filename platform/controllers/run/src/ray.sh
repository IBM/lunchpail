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
entrypoint="$8"
subPath="$9"
nWorkers="${10}"
cpu="${11}"
memory="${12}"
gpu="${13}"
datasets="${14}"
runtimeEnv="${15}"
loggingPolicy="${16}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

# Fire off a `kubectl wait` which will return when the job we are
# about to launch is running. Below, we will do a `wait` that
# subprocess. We need to launch this first, before doing the `kubectl
# apply` to avoid a race window.
(while true; do kubectl wait pod -l app.kubernetes.io/instance=$run_id --for=condition=Ready --timeout=-1s -n $namespace >& /dev/null && break; sleep 1; done) &

cm_file=$(mktemp)
echo -n $loggingPolicy | base64 -d > $cm_file

helm install --dry-run --debug $run_id "$SCRIPTDIR"/ray/ -n ${namespace} \
     --set kind=job \
     --set uid=$uid \
     --set name=$name \
     --set partOf=$part_of \
     --set enclosingStep=$step \
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
     --set fluentbit.configmap_name=$run_id \
     --set-file fluentbit.configmap=$cm_file \
     --set datasets=$datasets \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

kubectl apply -f $DRY 1>&2
rm $DRY
rm $cm_file

# Wait for the job to be running. See the `kubectl wait` above. Here,
# we are bash-waiting on that kubectl await!
wait

# Get and emit the head pod name; it will be the "return value" of
# this script. Take care not to emit anything else on stdout in this
# script!
while true; do
    HEAD=$(kubectl get pod -n $namespace -l app.kubernetes.io/instance=$run_id,ray.io/node-type=head --no-headers -o custom-columns=NAME:.metadata.name)
    if [[ -n "$HEAD" ]]; then
        echo -n $HEAD
        break
    fi
done

