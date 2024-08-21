#!/usr/bin/env bash

set -eo pipefail

# Allows us to capture workstealer info before it auto-terminates
export LUNCHPAIL_SLEEP_BEFORE_EXIT=10

if [[ -n "$1" ]]
then APP="--set app=$1"
fi

if [[ -n "$taskqueue" ]]
then QUEUE="--queue $taskqueue"
fi

if which lspci && lspci | grep -iq nvidia; then
    echo "$(tput setaf 2)Detected GPU support for arch=$ARCH$(tput sgr0)"
    GPU="--set supportsGpu=true"
fi

if [[ -n "$TEST_IBMCLOUD" ]]
then 
    IC_TARGET="--target ibmcloud --api-key $IC_API_KEY"
    IC_UP_ARGS="--resource-group-id $RESOURCE_GROUP_ID --zone us-south-1 --image-id r006-1169e41d-d654-45d5-bdd5-89e2dc6e8a68 --profile bx2-8x32"
    #--public-ssh-key=${SSH_KEY_PUB} \  #TODO: include it in IC_UP_ARGS string
fi

echo "Calling up using target=${LUNCHPAIL_TARGET:-kubernetes}"
$testapp up \
         -v \
         $IC_TARGET \
         $IC_UP_ARGS \
         $QUEUE \
         $APP \
         $GPU \
         $LP_ARGS \
         --target=${LUNCHPAIL_TARGET:-kubernetes} \
         --watch=false \
         --set global.arch=$ARCH \
         --set kubernetes.context=kind-lunchpail \
         --set cosAccessKey=$COS_ACCESS_KEY \
         --set cosSecretKey=$COS_SECRET_KEY
