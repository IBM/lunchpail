#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

echo "$(tput setaf 2)Shutting down CodeFlare$(tput sgr0)"
(helm ls | grep -q $RUN) && helm delete --wait $RUN
(helm ls | grep -q $IBM) && helm delete --wait $IBM
(helm ls | grep -q $PLA) && helm delete --wait $PLA

## WARNING!!! order matters in the above; e.g. don't delete examples
## after deleting crds, or helm gets supremely confused ANGR EMOJI

# sigh, helm delete does not delete crds
# https://helm.sh/docs/chart_best_practices/custom_resource_definitions/#some-caveats-and-explanations
kubectl get crd -o name | grep codeflare.dev | xargs kubectl delete
