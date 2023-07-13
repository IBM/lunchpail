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
nSteps="$7"
applicationNames="$8"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

helm install --dry-run --debug $run_id "$SCRIPTDIR"/sequence/ -n ${namespace} \
     --set uid=$uid \
     --set name=$name \
     --set namespace=$namespace \
     --set partOf=$part_of \
     --set enclosingStep=$step \
     --set nSteps=$nSteps \
     --set applicationNames="$applicationNames" \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

kubectl apply -f $DRY 1>&2
rm $DRY
