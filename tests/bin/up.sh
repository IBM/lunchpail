#!/usr/bin/env bash

set -eo pipefail

# Allows us to capture workstealer info before it auto-terminates
export LUNCHPAIL_SLEEP_BEFORE_EXIT=10
if [[ ${LUNCHPAIL_TARGET:-kubernetes} = kubernetes ]]
then export LUNCHPAIL_SLEEP_BEFORE_EXIT=30 # kubernetes validators are a bit slower due to the need to open a port-forward to minio
fi

if [[ -n "$taskqueue" ]]
then QUEUE="--queue $taskqueue"
fi

echo "Calling up using target=${LUNCHPAIL_TARGET:-kubernetes}"
if [[ -n "$inputapp" ]]
then
    # no-redirect so that helpers.sh can identify output and test
    # drain TODO if we add support for up --output-dir/-o, then we
    # could validate the output files there rather than in the queue
    eval $inputapp $QUEUE --create-cluster --target=${LUNCHPAIL_TARGET:-kubernetes} \
        | $testapp up \
                   --verbose=${VERBOSE:-false} \
                   $up_args \
                   --no-redirect \
                   --create-cluster \
                   --target=${LUNCHPAIL_TARGET:-kubernetes}
else
    eval $testapp up \
         --verbose=${VERBOSE:-false} \
         $up_args \
         $QUEUE \
         --create-cluster \
         --target=${LUNCHPAIL_TARGET:-kubernetes} \
         --set every=1
fi

# re: every, this configures the dispatchers to dispatch once per second
