#!/usr/bin/env bash

set -eo pipefail

# Allows us to capture workstealer info before it auto-terminates
export LUNCHPAIL_SLEEP_BEFORE_EXIT=5

if [[ -n "$1" ]]
then APP="--set app=$1"
fi

if [[ -n "$taskqueue" ]]
then QUEUE="--queue $taskqueue"
fi

if which lspci && lspci | grep -iq nvidia; then
    echo "$(tput setaf 2)Detected GPU support$(tput sgr0)"
    GPU="--set supportsGpu=true"
fi

echo "Calling up using target=${LUNCHPAIL_TARGET:-kubernetes}"
eval $testapp up \
         -v \
         $up_args \
         $QUEUE \
         $APP \
         $GPU \
         $LP_ARGS \
         --create-cluster \
         --target=${LUNCHPAIL_TARGET:-kubernetes} \
         --watch=false \
         --set venvPath=$VIRTUAL_ENV \
         --set kubernetes.context=kind-lunchpail \
         --set cosAccessKey=$COS_ACCESS_KEY \
         --set cosSecretKey=$COS_SECRET_KEY
