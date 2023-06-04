#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

function create_kind_if_absent {
    if [[ -z "$NO_KIND" ]]; then
        if ! kind get clusters | grep -q $LOCAL_CLUSTER_NAME; then
            echo "Creating kind cluster $(tput setaf 6)$LOCAL_CLUSTER_NAME$(tput sgr0) for EDA testing" 1>&2
            kind create cluster --name $LOCAL_CLUSTER_NAME
        fi
    fi
}

create_kind_if_absent
