#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

echo "$(tput setaf 2)Building CodeFlare$(tput sgr0)"
(cd platform/controllers/run && docker build -t $RUN_IMAGE .)

if [[ -z "$NO_KIND" ]]; then
    kind load docker-image -n $LOCAL_CLUSTER_NAME $RUN_IMAGE
else
    echo "!!TODO push to remote container registry"
    exit 1
fi
