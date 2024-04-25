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
volumes="${16}"
volumeMounts="${17}"
expose="${18}"
securityContext="${19}"
component="${20}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

helm install --dry-run --debug $run_id "$SCRIPTDIR"/shell/ -n ${namespace} \
     --set kind=job \
     --set uid=$uid \
     --set name=$name \
     --set partOf=$part_of \
     --set component=$component \
     --set enclosingStep=$step \
     --set image=$image \
     --set namespace=$namespace \
     --set command="$command" \
     --set subPath=$subPath \
     --set workers.count=$nWorkers \
     --set workers.cpu=$cpu \
     --set workers.memory=$memory \
     --set workers.gpu=$gpu \
     --set volumes=$volumes \
     --set volumeMounts=$volumeMounts \
     --set env="$env" \
     --set s3Endpoint=$INTERNAL_S3_ENDPOINT \
     --set s3AccessKey=$INTERNAL_S3_ACCESSKEY \
     --set s3SecretKey=$INTERNAL_S3_SECRETKEY \
     --set datasets=$dataset_labels \
     --set expose=$expose \
     --set mcad.enabled=${MCAD_ENABLED:-false } \
     --set rbac.runAsRoot=$RUN_AS_ROOT \
     --set rbac.serviceaccount="$USER_SERVICE_ACCOUNT" \
     --set securityContext=$securityContext \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

retries=20
while ! kubectl apply -f $DRY
do
    ((--retries)) || exit 1

    echo "Retrying kubectl apply"
    sleep 1
done

rm -f $DRY
