#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

# sigh, some components use kustomize, not helm
if [[ -d "$SCRIPTDIR"/../platform/kustomize ]]
then
    for kusto in "$SCRIPTDIR"/../platform/kustomize/*.sh
    do
        ($kusto down || exit 0)
    done
fi

echo "$(tput setaf 2)Shutting down CodeFlare$(tput sgr0)"
($HELM ls | grep -q $IBM) && $HELM delete --wait $IBM
($HELM ls | grep -q $PLA) && $HELM delete --wait $PLA

## WARNING!!! order matters in the above; e.g. don't delete examples
## after deleting crds, or helm gets supremely confused ANGR EMOJI

# sigh, helm delete does not delete crds
# https://helm.sh/docs/chart_best_practices/custom_resource_definitions/#some-caveats-and-explanations
$KUBECTL get crd -o name | grep codeflare.dev | xargs $KUBECTL delete
