#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
OUTDIR="$SCRIPTDIR"/../resources
TOP="$SCRIPTDIR"/../../..

if [[ ! -e "$OUTDIR" ]]
then mkdir "$OUTDIR"
fi

helm template --include-crds codeflare-platform "$TOP"/platform --set nvidia.enabled=false --set ray.enabled=false --set kube-fledged.enabled=false --set spark.enabled=false > "$OUTDIR"/jaas-lite.yml

helm template --include-crds codeflare-platform "$TOP"/platform --set nvidia.enabled=false --set ray.enabled=true --set kube-fledged.enabled=true --set spark.enabled=true > "$OUTDIR"/jaas-full.yml
