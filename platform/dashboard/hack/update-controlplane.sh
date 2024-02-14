#!/usr/bin/env bash

set -e
set -o pipefail
set -x

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../../..

. "$TOP"/hack/settings.sh

$KUBECTL delete -f resources/jaas-examples.yml --ignore-not-found 1>&2
$KUBECTL delete -f resources/jaas-lite.yml --ignore-not-found 1>&2
../../hack/build.sh # rebuild the controller images
./hack/generate-installers.sh # the dashboard includes a precompiled version of the jaas charts
$KUBECTL apply -f resources/jaas-lite.yml 1>&2
$KUBECTL apply -f resources/jaas-examples.yml 1>&2
