#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

echo "$(tput setaf 2)Building CodeFlare$(tput sgr0)"

function build {
    local dir="$1"
    local image=$2
    cd "$dir" && docker build -t $image .
}

function push {
    if [[ -z "$NO_IMAGE_PUSH" ]]; then
        local image=$1
        if [[ -z "$NO_KIND" ]]; then
            set -x
            kind load docker-image -n $CLUSTER_NAME $image
        else
            echo "!!TODO push to remote container registry"
            exit 1
        fi
    fi
}

function build_controllers {
    for controllerDir in "$SCRIPTDIR"/../platform/controllers/*; do
        local controller=$(basename "$controllerDir")
        local image=${IMAGE_REPO}codeflare-${controller}-controller:$VERSION
        (build "$controllerDir" $image ; push $image) &
    done
}

function build_components {
    for providerDir in "$SCRIPTDIR"/../platform/components/*; do
        if [[ -d "$providerDir" ]]; then
            local provider=$(basename "$providerDir")
            for componentDir in "$providerDir"/*; do
                local component=$(basename "$componentDir")
                local image=${IMAGE_REPO}${provider}-${component}-component:$VERSION
                (build "$componentDir" $image ; push $image) &
            done
        fi
    done
}

function build_test_images {
    for imageDir in "$SCRIPTDIR"/../tests/base-images/*; do
        local imageName=$(basename "$imageDir")
        local image=${IMAGE_REPO}codeflare-${imageName}-test:$VERSION
        (build "$imageDir" $image ; push $image) &
    done
}

build_test_images
build_controllers
build_components
wait
