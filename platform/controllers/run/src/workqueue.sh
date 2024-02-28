#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

uid="$1" # the kubernetes uid for the Run
run_name="$2" # run name
namespace="$3"
part_of="$4" # in case this run is part of e.g. an enclosing sequence flow
inbox="$5" # in case the Run wants to use a non-standard name for the inbox
queue_dataset="$6" # name of the queue Dataset
create_queue="$7" # true or false; if false, we assume the queue Dataset already exists
dataset_labels="$8" # any other datasets to mount into the workqueue pods

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

helm install --dry-run --debug $run_name "$SCRIPTDIR"/workqueue/ -n ${namespace} \
     --set uid=$uid \
     --set name=$run_name \
     --set namespace=$namespace \
     --set partOf=$part_of \
     --set inbox="$inbox" \
     --set taskqueue.create=$create_queue \
     --set taskqueue.dataset=$queue_dataset \
     --set taskqueue.bucket=$run_name \
     --set datasets=$dataset_labels \
     --set global.s3Endpoint=$INTERNAL_S3_ENDPOINT \
     --set global.s3AccessKey=$INTERNAL_S3_ACCESSKEY \
     --set global.s3SecretKey=$INTERNAL_S3_SECRETKEY \
     --set image.registry=$IMAGE_REGISTRY \
     --set image.repo=$IMAGE_REPO \
     --set image.version=$IMAGE_VERSION \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

kubectl apply -f $DRY 1>&2
# cp $DRY /tmp/yoyo-workqueue-$(basename $DRY) # debugging
rm -f $DRY
