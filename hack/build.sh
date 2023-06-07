#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

echo "$(tput setaf 2)Building CodeFlare$(tput sgr0)"

function build {
    local controllerDir=$1
    local image=$2
    cd $controllerDir && docker build -t $image .
}

function push {
    local image=$1
    if [[ -z "$NO_KIND" ]]; then
        kind load docker-image -n $CLUSTER_NAME $image
    else
        echo "!!TODO push to remote container registry"
        exit 1
    fi
}

for controllerDir in $SCRIPTDIR/../platform/controllers/*; do
    controller=$(basename $controllerDir)
    image=${IMAGE_REPO}codeflare-${controller}-controller:$VERSION
    (build $controllerDir $image ; push $image) &
done
wait

