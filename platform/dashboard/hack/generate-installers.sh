#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
OUTDIR="$SCRIPTDIR"/../resources
TOP="$SCRIPTDIR"/../../..

. "$TOP"/hack/secrets.sh
. "$TOP"/hack/settings.sh

if [[ ! -e "$OUTDIR" ]]
then mkdir "$OUTDIR"
fi

# re: the 2> stderr filters, scheduler-plugins as of 0.27.8 has
# symbolic links :( and helm warns us about these

cd "$TOP"/platform && ./prerender.sh

cd "$TOP"/platform && helm dependency update . \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \

# lite deployment
helm template --include-crds $NAMESPACE_SYSTEM -n $NAMESPACE_SYSTEM "$TOP"/platform $HELM_DEMO_SECRETS --set global.jaas.namespace.create=true --set global.jaas.namespace.name=$NAMESPACE_SYSTEM --set global.lite=true --set tags.examples=false --set tags.defaults=false --set tags.full=false --set tags.core=true \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$OUTDIR"/jaas-lite.yml

# full deployment
#helm template --include-crds codeflare-platform "$TOP"/platform $HELM_DEMO_SECRETS --set tags.examples=false --set tags.defaults=false --set tags.full=true --set tags.core=true > "$OUTDIR"/jaas-full.yml

# defaults
helm template --include-crds $NAMESPACE_SYSTEM -n $NAMESPACE_SYSTEM "$TOP"/platform --set tags.examples=false --set tags.defaults=true --set tags.full=false --set tags.core=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$OUTDIR"/jaas-defaults.yml

# examples
helm template --include-crds $NAMESPACE_SYSTEM -n $NAMESPACE_SYSTEM "$TOP"/platform $HELM_DEMO_SECRETS --set tags.examples=true --set tags.defaults=false --set tags.full=false --set tags.core=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$OUTDIR"/jaas-examples.yml
