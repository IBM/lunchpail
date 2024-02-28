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
    $KUBECTL delete -f "$RESOURCES"/jaas-default-user.yml --ignore-not-found & \
        $KUBECTL delete -f "$RESOURCES"/jaas-defaults.yml --ignore-not-found
    wait
    $KUBECTL delete -f "$RESOURCES"/jaas-lite.yml --ignore-not-found --grace-period=1
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
"$TOP"/hack/build.sh -l & "$TOP"/hack/shrinkwrap.sh -d "$RESOURCES"
wait

$KUBECTL apply -f "$RESOURCES"/jaas-lite.yml
$KUBECTL apply -f "$RESOURCES"/jaas-defaults.yml & \
    $KUBECTL apply -f "$RESOURCES"/jaas-default-user.yml
wait
