#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

if [[ -z "$NO_BUILD" ]]
then "$TOP"/hack/build.sh -l > /dev/null &
fi

if ls "$TOP"/builds/lite/*.yml > /dev/null 2>&1
then kubectl delete --ignore-not-found -f "$TOP"/builds/lite/*.yml &
fi

"$TOP"/hack/shrinkcore.sh "$TOP"/builds

wait

f="$TOP"/builds/lite/02-jaas.yml
if [ -f "${f%%.yml}.namespace" ]; then ns="-n $(cat "${f%%.yml}.namespace")"; else ns=""; fi
kubectl apply --server-side -f "$f" $ns

kubectl wait pod -l app.kubernetes.io/name=dlf --for=condition=ready --timeout=-1s $ns
kubectl wait pod -l app.kubernetes.io/part-of=lunchpail.io --for=condition=ready --timeout=-1s $ns
