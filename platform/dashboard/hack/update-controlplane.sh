#!/usr/bin/env bash

while getopts "ki" opt
do
    case $opt in
        k) KILL=true; continue;;
        i) INIT=true; continue;;
    esac
done

set -x

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../../..

. "$TOP"/hack/settings.sh

# location of pre-generated yamls
RESOURCES="$SCRIPTDIR"/../resources

if [[ ! -n "$INIT" ]]; then 
    set +e

    # Hack to delete dataset finalizers
    # https://github.com/datashim-io/datashim/issues/341
    $KUBECTL get dataset -n $NAMESPACE_USER -o name | xargs $KUBECTL patch -p '{"metadata":{"finalizers":null}}' --type=merge -n $NAMESPACE_USER

    # iterate over the shrinkwraps in reverse order, since the natural
    # order will place preqreqs up front
    for f in $(ls "$RESOURCES"/*.yml | sort -r)
    do
        if [[ -f "${f%%.yml}.namespace" ]]; then ns="-n $(cat "${f%%.yml}.namespace")"; else ns=""; fi
        $KUBECTL delete -f $f --ignore-not-found $ns
    done
else
    "$TOP"/hack/init.sh;
    wait
fi

if [[ -n "$KILL" ]]; then exit; fi

set -e
set -o pipefail

if (podman machine inspect | grep State | grep running) && (kind get nodes -n ${CLUSTER_NAME} | grep ${CLUSTER_NAME})
then 
        if ! kubectl get nodes --context kind-${CLUSTER_NAME} | grep ${CLUSTER_NAME}
        then # podman must have restarted causing kind node to be deleted
            kind get nodes -A | xargs -n1 podman start
        fi
else
    "$TOP"/hack/init.sh;
    wait
fi

# rebuild the controller images & the dashboard includes a precompiled version of the jaas charts
"$TOP"/hack/build.sh -l & "$TOP"/hack/shrinkwrap.sh -l -d "$RESOURCES"
wait

for f in "$RESOURCES/*.yml"
do
    if [[ -n "$RUNNING_TESTS" ]] && [[ $(basename $f) =~ default-user ]]
    then echo "Skipping default-user for tests"
    fi

    if [[ -f "${f%%.yml}.namespace" ]]; then ns="-n $(cat "${f%%.yml}.namespace")"; else ns=""; fi
    $KUBECTL apply -f "$f" $ns --server-side --force-conflicts
done
