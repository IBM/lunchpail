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

if [[ -n "$TEST_IBMCLOUD" ]]
then 
    IC_TARGET="--target ibmcloud --api-key $IC_API_KEY"
    IC_UP_ARGS="--resource-group-id $RESOURCE_GROUP_ID --zone us-south-1 --image-id r006-1169e41d-d654-45d5-bdd5-89e2dc6e8a68 --profile bx2-8x32"
    #--public-ssh-key=${SSH_KEY_PUB} \  #TODO: include it in IC_UP_ARGS string
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
         $IC_TARGET \
         $IC_UP_ARGS \
         $QUEUE \
         --create-cluster \
         --target=${LUNCHPAIL_TARGET:-kubernetes} \
         --set every=1
fi

# re: every, this configures the dispatchers to dispatch once per second
