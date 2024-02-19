#!/usr/bin/env bash

set -e
set -o pipefail
set -x

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../../..

. "$TOP"/hack/settings.sh

$KUBECTL delete -f resources/jaas-examples.yml --ignore-not-found || true
$KUBECTL delete -f resources/jaas-defaults.yml --ignore-not-found || true
$KUBECTL delete -f resources/jaas-lite.yml --ignore-not-found || true

# rebuild the controller images & the dashboard includes a precompiled version of the jaas charts
../../hack/build.sh & ./hack/generate-installers.sh

$KUBECTL apply -f resources/jaas-lite.yml 1>&2
$KUBECTL apply -f resources/jaas-defaults.yml 1>&2
$KUBECTL apply -f resources/jaas-examples.yml 1>&2
