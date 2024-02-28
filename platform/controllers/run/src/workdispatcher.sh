#!/usr/bin/env bash

set -x
set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

uid="$1"
name="$2"
namespace="$3"
method="$4" # e.g. tasksimulator vs parametersweep
injectedTasksPerInterval="$5"
intervalSeconds="$6"
format="$7" # format of simulated input, e.g. "parquet"
columns="$8" # column names of simulated input
columnTypes="$9" # column types of simulated input
sweepMin="${10}"
sweepMax="${11}"
sweepStep="${12}"
queue_dataset="${13}"
datasets="${14}"
path_to_chart="${15:-$SCRIPTDIR/workdispatcher}" # :- so that we use the default if $15 is an empty string
values="${16}"
run_name="${17}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

if [[ -n "$values" ]]
then
    VALUES="$(mktemp).json"
    echo "$values" > $VALUES
    VALUES_ARG="-f $VALUES"
fi

helm install --dry-run --debug ${name}-${method} "$path_to_chart" -n ${namespace} ${VALUES_ARG} \
     --set uid=$uid \
     --set name=$name \
     --set runName=$run_name \
     --set image=$image \
     --set namespace=$namespace \
     --set method=$method \
     --set partOf=$dataset_name \
     --set queue.dataset=$queue_dataset \
     --set injectedTasksPerInterval=$injectedTasksPerInterval \
     --set intervalSeconds=$intervalSeconds \
     --set datasets=$datasets \
     --set format=$format \
     --set columns="$columns" \
     --set columnTypes="$columnTypes" \
     --set sweep.min="$sweepMin" \
     --set sweep.max="$sweepMax" \
     --set sweep.step="$sweepStep" \
     --set global.image.registry=$IMAGE_REGISTRY \
     --set global.image.repo=$IMAGE_REPO \
     --set global.image.version=$IMAGE_VERSION \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

kubectl apply -f $DRY 1>&2
rm -f $DRY
# if [[ -f $VALUES ]]; then rm -f $VALUES; fi
