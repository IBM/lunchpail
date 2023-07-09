#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

function create_kind_if_absent {
    if [[ -z "$NO_KIND" ]]; then
        if ! kind get clusters | grep -q $CLUSTER_NAME; then
            echo "Creating kind cluster $(tput setaf 6)$CLUSTER_NAME$(tput sgr0) for EDA testing" 1>&2
            kind create cluster --name $CLUSTER_NAME
        fi
    fi
}

function helm_dependency_update {
    # i'm not sure how to manage this without hard-coding the
    # sub-charts that pull in external dependencies
    helm dependency update platform/charts/third-party
}

create_kind_if_absent
helm_dependency_update
