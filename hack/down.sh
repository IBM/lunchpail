#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

# kill any test resources before we bring down controllers
"$SCRIPTDIR"/../tests/bin/undeploy-tests.sh || kubectl delete ns codeflare-test --ignore-not-found || true

# sigh, some components use kustomize, not helm
if [[ -z "$LITE" ]] && [[ -d "$SCRIPTDIR"/../platform/kustomize ]]
then
    for kusto in "$SCRIPTDIR"/../platform/kustomize/*.sh
    do
        ($kusto down || exit 0)
    done
fi

echo "$(tput setaf 2)Shutting down JaaS$(tput sgr0)"
if [[ -z "$LITE" ]]
then ($HELM ls -A | grep -q $IBM) && $HELM delete --wait $IBM
fi

# iterate over the shrinkwraps in reverse order, since the natural
# order will place preqreqs up front
for f in $(ls "$SCRIPTDIR"/shrinks/*.yml | sort -r)
do
    if [[ -f "${f%%.yml}.namespace" ]]; then ns="-n $(cat "${f%%.yml}.namespace")"; else ns=""; fi
    $KUBECTL delete -f $f --ignore-not-found $ns
done
