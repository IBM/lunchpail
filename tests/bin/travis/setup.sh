#!/usr/bin/env bash

set -e
set -o pipefail

# ibm travis currently runs ubuntu 20, for which there are no podman
# v4 builds. We rely on v4 for the `podman machine init --rootful`
# option
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
