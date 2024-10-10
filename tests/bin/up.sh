#!/usr/bin/env bash

set -eo pipefail

# Allows us to capture workstealer info before it auto-terminates
export LUNCHPAIL_SLEEP_BEFORE_EXIT=5

if [[ -n "$taskqueue" ]]
then QUEUE="--queue $taskqueue"
fi

echo "Calling up using target=${LUNCHPAIL_TARGET:-kubernetes}"
eval $testapp up \
         -v \
         $up_args \
         $QUEUE \
         --create-cluster \
         --target=${LUNCHPAIL_TARGET:-kubernetes} \
         --watch=false
