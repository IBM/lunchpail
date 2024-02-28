#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

# kill any test resources before we bring down controllers
"$SCRIPTDIR"/../tests/bin/undeploy-tests.sh || kubectl delete ns codeflare-test --ignore-not-found || true

# sigh, some components use kustomize, not helm
if [[ -d "$SCRIPTDIR"/../platform/kustomize ]]
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

($HELM ls -A | grep -q $PLA) && $HELM delete --wait $PLA -n $NAMESPACE_SYSTEM

# sigh, we can do helm install --create-namespace... but on the delete
# side, we're on our own:
$KUBECTL delete ns $NAMESPACE_SYSTEM

## WARNING!!! order matters in the above; e.g. don't delete examples
## after deleting crds, or helm gets supremely confused ANGR EMOJI

# sigh, helm delete does not delete crds
# https://helm.sh/docs/chart_best_practices/custom_resource_definitions/#some-caveats-and-explanations
$KUBECTL get crd -o name | grep codeflare.dev | xargs $KUBECTL delete
