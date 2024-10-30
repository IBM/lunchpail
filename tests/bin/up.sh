#!/usr/bin/env bash

set -eo pipefail

# Allows us to capture workstealer info before it auto-terminates
export LUNCHPAIL_SLEEP_BEFORE_EXIT=5
if [[ ${LUNCHPAIL_TARGET:-kubernetes} = kubernetes ]]
then LUNCHPAIL_SLEEP_BEFORE_EXIT=15 # kubernetes validators are a bit slower due to the need to open a port-forward to minio
fi

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
         --set every=1

# re: every, this configures the dispatchers to dispatch once per second
