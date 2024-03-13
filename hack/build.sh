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

# podman sucks... if you have pushed a remote multi-arch manifest, it
# inists on using the wrong platform when building a non-manifest
# build
if [[ $(uname -m) = arm64 ]]
then MY_PLATFORM=linux/arm64/v8
else MY_PLATFORM=linux/amd64
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

    if [[ -n "$ONLY_IMAGE_PUSH" ]]
    then return
    elif [[ -n "$PROD" ]]
    then
        if ${DOCKER-docker} image exists $image 2> /dev/null && ! ${DOCKER-docker} manifest exists $image 2> /dev/null
        then
            # we have a previously built image that is not a manifest
            echo "Clearing out prior non-manifest image $image"
            ${DOCKER-docker} image rm $image
        fi
    
        if ! ${DOCKER-docker} manifest exists $image 2> /dev/null
        then
            echo "Creating manifest $image"
            ${DOCKER-docker} manifest create $image
        fi
        
        (cd "$dir" && \
             ${DOCKER-docker} build $QUIET \
                              --build-arg registry=$IMAGE_REGISTRY --build-arg repo=$IMAGE_REPO --build-arg version=$VERSION \
                              --platform=${PLATFORM-linux/arm64/v8,linux/amd64} \
                              --manifest $image \
                              -f "$dockerfile" \
                              .
        )
    else
        if ${DOCKER-docker} manifest exists $image 2> /dev/null
        then
            echo "Removing prior manifest from prod builds $image"
            ${DOCKER-docker} manifest rm $image
        fi

        set -e
        (cd "$dir" && ${DOCKER-docker} build $QUIET --platform=$MY_PLATFORM \
                                       --build-arg registry=$IMAGE_REGISTRY --build-arg repo=$IMAGE_REPO --build-arg version=$VERSION \
                                       -t $image \
                                       -f "$dockerfile" \
                                       .
        )
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
                local image2=${image%%:$VERSION}
                curhash=$($SUDO podman exec -it ${CLUSTER_NAME}-control-plane crictl images | grep "$image2 " | grep $VERSION | awk '{print $3}' | head -c 12 || echo "nope")
                newhash=$(podman image ls | grep "$image2 " | grep $VERSION | awk '{print $3}' | head -c 12 || echo "nope2")
                if [[ "$curhash" != "$newhash" ]]
                then
                    echo "pushing $image $curhash $newhash"
                    T=$(mktemp)
                    podman save $image -o $T
                    $KIND -n $CLUSTER_NAME load image-archive $T
                    rm -f $T
                else
                    echo "already pushed $image"
                fi
            else
                $KIND load docker-image -n $CLUSTER_NAME $image
            fi
        else
            echo "!!TODO push to remote container registry"
            exit 1
        fi
    fi
}

function build_controllers {
    for controllerDir in "$SCRIPTDIR"/../platform/controllers/*
    do
        local controller=$(basename "$controllerDir")

        if [[ -z "$LITE" ]]
        then
            local image=${IMAGE_REPO_FOR_BUILD}jaas-${controller}-controller:$VERSION
            (build "$controllerDir" $image ; push $image) &
        # built "lite" version if Dockerfile.lite exists
        elif [[ -f "$controllerDir"/Dockerfile.lite ]]
        then
            local image=${IMAGE_REPO_FOR_BUILD}jaas-${controller}-controller-lite:$VERSION
            (set -e; build "$controllerDir" $image Dockerfile.lite ; push $image) &
        fi
    done
}

function buildAndPush {
    set -e
    local componentDir="$1"
    local provider=$2

    local component=$(basename "$componentDir")
    local image=${IMAGE_REPO_FOR_BUILD}${provider}-${component}-component:$VERSION
    build "$componentDir" $image
    push $image
    echo "Successfully built component $image"
}

function build_components {
    for providerDir in "$SCRIPTDIR"/../platform/components/*
    do
        if [[ -d "$providerDir" ]]
        then
            local provider=$(basename "$providerDir")
            for i in $(seq 1 5)
            do
                for componentDir in "$providerDir"/*; do echo $componentDir; done |
                    (
                        export -f buildAndPush
                        export -f build
                        export -f push
                        export PROD
                        export VERSION
                        export CLUSTER_NAME
                        export IMAGE_REPO_FOR_BUILD
                        xargs -I{} --max-procs $(nproc) bash -c "buildAndPush {} $provider"
                    ) && break || echo "Retrying build_components"
            done
        fi
    done
}

function build_test_images {
    for imageDir in "$SCRIPTDIR"/../tests/base-images/*; do
        if [[ -e "$imageDir"/.disabled ]]; then continue; fi

        local imageName=$(basename "$imageDir")
        local image=${IMAGE_REPO_FOR_BUILD}jaas-${imageName}-test:$VERSION
        (build "$imageDir" $image ; push $image) &
    done
}

if [[ -n "$PROD" ]] && [[ -n "$DOING_UP" ]]
then
    echo "$(tput setaf 3)Skipping build because we are running in production mode$(tput sgr0)"
    exit
fi

check_podman
build_test_images
build_components
wait # ugh, too much concurrency which overloads the podman machine on macOS
build_controllers
wait
