#!/usr/bin/env bash

set -eo pipefail

# Keeping this here, in case we want to test podman in CI.
# if ! which podman >& /dev/null
# then
#     echo "Installing podman"
#     sudo apt update
#     sudo apt -y install podman
#
#     podman machine init --rootful
#     podman machine start
# fi

# Danger: see the warnings in ./kindhack.yaml
if [[ $(uname) = Linux ]]
then
    echo "Copying in kind hack"
    SCRIPTDIR=$(cd $(dirname "$0") && pwd)
    cp "$SCRIPTDIR"/kindhack.yaml /tmp/kindhack.yaml
fi
