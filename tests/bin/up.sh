#!/usr/bin/env bash

set -eo pipefail

# Allows us to capture workstealer info before it auto-terminates
export LUNCHPAIL_SLEEP_BEFORE_EXIT=5

if [[ -n "$taskqueue" ]]
then QUEUE="--queue $taskqueue"
fi

# due to the use of eval, `up` will think it is not attached to a tty
export LUNCHPAIL_FORCE_WATCH=1

# same re: eval... the pipeline/redirect needs to know it is attached to a tty
export LUNCHPAIL_FORCE_TTY=1

echo "Calling up using target=${LUNCHPAIL_TARGET:-kubernetes}"
eval $testapp up \
         -v \
         $up_args \
         $QUEUE \
         --create-cluster \
         --target=${LUNCHPAIL_TARGET:-kubernetes} \
         --watch=true
