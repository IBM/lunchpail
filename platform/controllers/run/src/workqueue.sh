#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

uid="$1"
name="$2"
namespace="$3"
part_of="$4"
run_id="$5"
dataset="$6"
dataset_labels="$7"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

helm install --dry-run --debug $run_id "$SCRIPTDIR"/workqueue/ -n ${namespace} \
     --set uid=$uid \
     --set name=$name \
     --set namespace=$namespace \
     --set partOf=$part_of \
     --set dataset=$dataset \
     --set datasets=$dataset_labels \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

kubectl apply -f $DRY 1>&2
rm $DRY
