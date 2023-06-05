#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

echo "$(tput setaf 2)Shutting down CodeFlare$(tput sgr0)"
helm delete --wait $RUN
helm delete --wait $IBM
helm delete --wait $PLA

## WARNING!!! order matters in the above; e.g. don't delete examples
## after deleting crds, or helm gets supremely confused ANGR EMOJI

# sigh, helm delete does not delete crds
# https://helm.sh/docs/chart_best_practices/custom_resource_definitions/#some-caveats-and-explanations
# TODO delete them manually?
