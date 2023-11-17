#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
OUTDIR="$SCRIPTDIR"/../resources
TOP="$SCRIPTDIR"/../../..

. "$TOP"/hack/secrets.sh

if [[ ! -e "$OUTDIR" ]]
then mkdir "$OUTDIR"
fi

cd "$TOP"/platform && helm dependency update .

# lite deployment
helm template --include-crds codeflare-platform "$TOP"/platform $HELM_DEMO_SECRETS --set global.lite=true --set tags.examples=false --set tags.defaults=false --set tags.full=false --set tags.core=true > "$OUTDIR"/jaas-lite.yml

# full deployment
#helm template --include-crds codeflare-platform "$TOP"/platform $HELM_DEMO_SECRETS --set tags.examples=false --set tags.defaults=false --set tags.full=true --set tags.core=true > "$OUTDIR"/jaas-full.yml

# defaults
helm template --include-crds codeflare-platform "$TOP"/platform --set tags.examples=false --set tags.defaults=true --set tags.full=false --set tags.core=false > "$OUTDIR"/jaas-defaults.yml

# examples
helm template --include-crds codeflare-platform "$TOP"/platform $HELM_DEMO_SECRETS --set tags.examples=true --set tags.defaults=false --set tags.full=false --set tags.core=false > "$OUTDIR"/jaas-examples.yml

