#!/usr/bin/env bash

#
# Generate a self-contained installable yaml
#
# Usage:
#   shrinkwrap.sh -f /tmp/jaas.yaml
#   shrinkwrap.sh -d resources/
#
# The former will emit a single file, the latter will emit three
# spearate files (core, defaults, default-user) in the given
# directory. By optionally passing `-a '--set key1=val1 --set
# key2=val2'`, you may inject Helm install values into the srinkwrap.
#

set -e
set -o pipefail

while getopts "f:d:a" opt
do
    case $opt in
        d) OUTDIR=${OPTARG}; continue;;
        f) OUTFILE=${OPTARG}; continue;;
        a) HELM_INSTALL_FLAGS="${OPTARG}"; continue;;
    esac
done
shift $((OPTIND-1))

if [[ -n "$OUTFILE" ]]
then
    echo "Single-file output to $OUTFILE"
    CORE="$OUTFILE"
    DEFAULTS="$OUTFILE"
    DEFAULT_USER="$OUTFILE"
    rm -f "$OUTFILE"
elif [[ -n "$OUTDIR" ]]
then
    echo "Multi-file output to $OUTDIR"
    if [[ ! -e "$OUTDIR" ]]
    then mkdir -p "$OUTDIR"
    else
        rm -f "$OUTDIR"/jaas-lite.yml
        rm -f "$OUTDIR"/jaas-defaults.yml
        rm -f "$OUTDIR"/jaas-default-user.yml
    fi

    CORE="$OUTDIR"/jaas-lite.yml
    DEFAULTS="$OUTDIR"/jaas-defaults.yml
    DEFAULT_USER="$OUTDIR"/jaas-default-user.yml
else
    echo "Error: -d or -f argument is required. Please specify either a target output file (-f) or a target output directory (-d)" 1>&2
    exit 1
fi

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

. "$TOP"/hack/settings.sh
. "$TOP"/hack/secrets.sh

(cd "$TOP"/platform && ./prerender.sh)

(cd "$TOP"/platform && helm dependency update . \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2))

# Note re: the 2> stderr filters below. scheduler-plugins as of 0.27.8
# has symbolic links :( and helm warns us about these

# lite deployment
helm template \
     --include-crds \
     $NAMESPACE_SYSTEM \
     -n $NAMESPACE_SYSTEM \
     "$TOP"/platform \
     $HELM_DEMO_SECRETS \
     --set global.jaas.namespace.create=true \
     $HELM_INSTALL_FLAGS $HELM_INSTALL_LITE_FLAGS \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     >> "$CORE"

# defaults
helm template \
     jaas-defaults \
     -n $NAMESPACE_SYSTEM \
     "$TOP"/platform \
     $HELM_INSTALL_FLAGS \
     --set tags.default-user=false --set tags.defaults=true --set tags.full=false --set tags.core=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     >> "$DEFAULTS" 

# default-user
helm template \
     jaas-default-user \
     "$TOP"/platform \
     $HELM_DEMO_SECRETS $HELM_INSTALL_FLAGS \
     --set tags.default-user=true --set tags.defaults=false --set tags.full=false --set tags.core=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     >> "$DEFAULT_USER"
