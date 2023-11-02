#!/usr/bin/env bash

set -x
set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

uid="$1"
name="$2"
namespace="$3"
injectedTasksPerInterval="$4"
intervalSeconds="$5"
format="$6" # format of simulated input, e.g. "parquet"
columns="$7" # column names of simulated input
columnTypes="$8" # column types of simulated input
dataset_name="$9"
datasets="${10}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

helm install --dry-run --debug ${name}-tasksimulator "$SCRIPTDIR"/tasksimulator/ -n ${namespace} \
     --set uid=$uid \
     --set name=$name \
     --set image=$image \
     --set namespace=$namespace \
     --set partOf=$dataset_name \
     --set queue.dataset=$dataset_name \
     --set injectedTasksPerInterval=$injectedTasksPerInterval \
     --set intervalSeconds=$intervalSeconds \
     --set datasets=$datasets \
     --set format=$format \
     --set columns="$columns" \
     --set columnTypes="$columnTypes" \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

kubectl apply -f $DRY 1>&2
rm $DRY
