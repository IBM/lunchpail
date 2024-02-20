#!/usr/bin/env bash

while getopts "k" opt
do
    case $opt in
        k) KILL=true; continue;;
    esac
done

set -x

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../../..

. "$TOP"/hack/settings.sh

set +e
$KUBECTL delete -f resources/jaas-default-user.yml --ignore-not-found & \
    $KUBECTL delete -f resources/jaas-defaults.yml --ignore-not-found
wait
$KUBECTL delete -f resources/jaas-lite.yml --ignore-not-found --grace-period=1

if [[ -n "$KILL" ]]; then exit; fi

set -e
set -o pipefail

# rebuild the controller images & the dashboard includes a precompiled version of the jaas charts
../../hack/build.sh & ./hack/generate-installers.sh
wait

$KUBECTL apply -f resources/jaas-lite.yml
$KUBECTL apply -f resources/jaas-defaults.yml & \
    $KUBECTL apply -f resources/jaas-default-user.yml
wait
