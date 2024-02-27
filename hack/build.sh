#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

trap "pkill -P $$" SIGINT

echo "$(tput setaf 2)Building JaaS$(tput sgr0)"

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

    if [[ -n "$PROD" ]]
    then
        if ${DOCKER-docker} image exists $image && ! ${DOCKER-docker} manifest exists $image
        then
            # we have a previously built image that is not a manifest
            echo "Clearing out prior non-manifest image $image"
            ${DOCKER-docker} image rm $image
        fi
    
        if ! ${DOCKER-docker} manifest exists $image
        then
            echo "Creating manifest $image"
            ${DOCKER-docker} manifest create $image
        fi
        
        cd "$dir" && ${DOCKER-docker} build $QUIET --platform=${PLATFORM-linux/arm64/v8,linux/amd64} --manifest $image -f "$dockerfile" .
    else
        if ${DOCKER-docker} manifest exists $image
        then
            echo "Removing prior manifest from prod builds $image"
            ${DOCKER-docker} manifest rm $image
        fi

        cd "$dir" && ${DOCKER-docker} build $QUIET -t $image -f "$dockerfile" .
    fi
}

function push {
    if [[ -n "$PROD" ]]
    then
        # for production builds, push built manifest
        ${DOCKER-docker} manifest push $image
    elif [[ -z "$NO_IMAGE_PUSH" ]]; then
        local image=$1
        if [[ -z "$NO_KIND" ]]; then
            if [[ -n "$USING_PODMAN" ]]
            then
                local image2=${image%%:dev}
                curhash=$(podman exec -it ${CLUSTER_NAME}-control-plane crictl images | grep $image2 | awk '{print $3}' | head -c 12 || echo "nope")
                newhash=$(podman image ls | grep $image2 | awk '{print $3}' | head -c 12 || echo "nope2")
                if [[ "$curhash" != "$newhash" ]]
                then
                    echo "pushing $image"
                    T=$(mktemp)
                    podman save $image -o $T
                    kind -n $CLUSTER_NAME load image-archive $T
                    rm -f $T
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

        if [[ -z "$LITE" ]]
        then
            local image=${IMAGE_REPO}jaas-${controller}-controller:$VERSION
            (build "$controllerDir" $image ; push $image) &
        fi

        # built "lite" version if Dockerfile.lite exists
        if [[ -f "$controllerDir"/Dockerfile.lite ]]
        then
            local image=${IMAGE_REPO}jaas-${controller}-controller-lite:$VERSION
            (build "$controllerDir" $image Dockerfile.lite ; push $image) &
        fi
    done
}

function build_components {
    for providerDir in "$SCRIPTDIR"/../platform/components/*
    do
        if [[ -d "$providerDir" ]]
        then
            local provider=$(basename "$providerDir")
            for i in $(seq 1 5)
            do
                for componentDir in "$providerDir"/*
                do
                    local component=$(basename "$componentDir")
                    local image=${IMAGE_REPO}${provider}-${component}-component:$VERSION
                    (build "$componentDir" $image && push $image && echo "Successfully built component $image") &
                done

                wait && break

                echo "Retrying build_components"
            done
        fi
    done
}

function build_test_images {
    for imageDir in "$SCRIPTDIR"/../tests/base-images/*; do
        if [[ -e "$imageDir"/.disabled ]]; then continue; fi

        local imageName=$(basename "$imageDir")
        local image=${IMAGE_REPO}jaas-${imageName}-test:$VERSION
        (build "$imageDir" $image ; push $image) &
    done
}

check_podman
build_test_images
build_components
wait # ugh, too much concurrency which overloads the podman machine on macOS
build_controllers
wait
