#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

trap "pkill -P $$" SIGINT

echo "$(tput setaf 2)Building CodeFlare$(tput sgr0)"

if [[ -n "$CI" ]] && [[ -z "$DEBUG" ]]
then
    QUIET="-q"
fi

function check_podman {
    export DOCKER=docker
    
    if which podman
    then
        export USING_PODMAN=1
        echo "Using podman for build.sh"
        export KIND_EXPERIMENTAL_PROVIDER=podman
        export DOCKER=podman
    fi
}

function build {
    local dir="$1"
    local image=$2
    local dockerfile="${3-Dockerfile}"
    echo "Building dockerfile=$dockerfile image=$image"
    cd "$dir" && ${DOCKER-docker} build $QUIET -t $image -f "$dockerfile" .
}

function push {
    if [[ -z "$NO_IMAGE_PUSH" ]]; then
        local image=$1
        if [[ -z "$NO_KIND" ]]; then
            if [[ -n "$USING_PODMAN" ]]
            then
                local image2=${image%%:dev}
                curhash=$(podman exec -it ${CLUSTER_NAME}-control-plane crictl images | grep $image2 | awk '{print $3}' | head -c 12)
                newhash=$(podman image ls | grep $image2 | awk '{print $3}' | head -c 12)
                if [[ "$curhash" != "$newhash" ]]
                then
                    echo "pushing $image"
                    T=$(mktemp)
                    (podman save $image -o $T && kind -n $CLUSTER_NAME load image-archive $T && rm -f $T) &
                else
                    echo "already pushed $image"
                fi
            else
                kind load docker-image -n $CLUSTER_NAME $image
            fi
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

        # built "lite" version if Dockerfile.lite exists
        if [[ -f "$controllerDir"/Dockerfile.lite ]]
        then
            local image=${IMAGE_REPO}codeflare-${controller}-controller-lite:$VERSION
            (build "$controllerDir" $image Dockerfile.lite ; push $image) &
        fi
    done
}

function build_components {
    for providerDir in "$SCRIPTDIR"/../platform/components/*; do
        if [[ -d "$providerDir" ]]; then
            local provider=$(basename "$providerDir")
            for componentDir in "$providerDir"/*; do
                local component=$(basename "$componentDir")
                local image=${IMAGE_REPO}${provider}-${component}-component:$VERSION
                (build "$componentDir" $image && push $image || build "$componentDir" $image && push $image || build "$componentDir" $image && push $image || build "$componentDir" $image && push $image) &
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

check_podman
build_test_images
build_components
wait # ugh, too much concurrency which overloads the podman machine on macOS
build_controllers
wait
