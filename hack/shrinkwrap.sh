#!/usr/bin/env bash

#
# Generate a self-contained installable yaml
#
# Usage:
#   shrinkwrap.sh -d resources/
#
# This will emit four spearate files (prereqs, core, defaults,
# default-user) in the given directory. By optionally passing `-a
# '--set key1=val1 --set key2=val2'`, you may inject Helm install
# values into the srinkwrap.
#

set -e
set -o pipefail

JAAS_FULL=${JAAS_FULL:-false}

while getopts "ac:d:fl" opt
do
    case $opt in
        d) OUTDIR=${OPTARG}; continue;;
        f) JAAS_FULL=true; continue;;
        a) EXTRA_HELM_INSTALL_FLAGS="${OPTARG}"; continue;;
        l) LITE=1; continue;;
    esac
done
OPTIND=1

if [[ -n "$OUTDIR" ]]
then
    echo "Multi-file output to $OUTDIR"
    PREREQS1="$OUTDIR"/01-jaas-prereqs1.yml
    CORE="$OUTDIR"/02-jaas.yml
    DEFAULTS="$OUTDIR"/04-jaas-defaults.yml
    DEFAULT_USER="$OUTDIR"/05-jaas-default-user.yml

    if [[ ! -e "$OUTDIR" ]]
    then mkdir -p "$OUTDIR"
    else rm -f "$OUTDIR"/*.{yml,namespace}
    fi
else
    echo "Usage: shrinkwrap.sh -d <outdir>" 1>&2
    exit 1
fi

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..
WRAPS="$SCRIPTDIR"/shrinkwrap

if [[ -z "$HELM_DEPENDENCY_DONE" ]]
then
   . "$TOP"/hack/settings.sh
   . "$TOP"/hack/secrets.sh
fi

HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS $EXTRA_HELM_INSTALL_FLAGS"

if [[ -n "$LITE" ]]
then HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS $HELM_INSTALL_LITE_FLAGS"
fi

(cd "$TOP"/platform && ./prerender.sh)

if [[ -z "$HELM_DEPENDENCY_DONE" ]]
then
  (cd "$TOP"/platform && helm dependency update . \
       2> >(grep -v 'found symbolic link' >&2) \
       2> >(grep -v 'Contents of linked' >&2))
fi

# Note re: the 2> stderr filters below. scheduler-plugins as of 0.27.8
# has symbolic links :( and helm warns us about these

echo "Final shrinkwrap HELM_INSTALL_FLAGS=$HELM_INSTALL_FLAGS"

# prereqs that the core depends on
$HELM_TEMPLATE \
     --include-crds \
     $NAMESPACE_SYSTEM \
     -n $NAMESPACE_SYSTEM \
     "$TOP"/platform \
     $HELM_DEMO_SECRETS \
     $HELM_INSTALL_FLAGS \
     --set global.jaas.namespace.create=true \
     --set tags.full=false \
     --set tags.core=false \
     --set tags.prereqs1=true \
     --set tags.defaults=false \
     --set tags.default-user=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$PREREQS1"

# core deployment
$HELM_TEMPLATE \
     --include-crds \
     $NAMESPACE_SYSTEM \
     -n $NAMESPACE_SYSTEM \
     "$TOP"/platform \
     $HELM_DEMO_SECRETS \
     $HELM_IMAGE_PULL_SECRETS \
     $HELM_INSTALL_FLAGS \
     --set tags.full=$JAAS_FULL \
     --set tags.core=true \
     --set tags.prereqs1=false \
     --set tags.defaults=false \
     --set tags.default-user=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$CORE"

# the kuberay-operator chart has some problems with namespaces; ensure
# that we force everything in core into $NAMESPACE_SYSTEM
echo "$NAMESPACE_SYSTEM" > "${CORE%%.yml}.namespace"

# defaults
$HELM_TEMPLATE \
     jaas-defaults \
     -n $NAMESPACE_SYSTEM \
     "$TOP"/platform \
     $HELM_INSTALL_FLAGS \
     --set tags.full=false \
     --set tags.core=false \
     --set tags.prereqs1=false \
     --set tags.defaults=true \
     --set tags.default-user=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$DEFAULTS" 

# default-user
$HELM_TEMPLATE \
     jaas-default-user \
     "$TOP"/platform \
     $HELM_DEMO_SECRETS $HELM_INSTALL_FLAGS \
     $HELM_IMAGE_PULL_SECRETS \
     --set tags.full=false \
     --set tags.core=false \
     --set tags.prereqs1=false \
     --set tags.defaults=false \
     --set tags.default-user=true \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$DEFAULT_USER"

mkdir -p "$OUTDIR"/logs/controllers

# up
cat "$WRAPS"/up.sh | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" | sed "s#\$ARCH#$ARCH#g" > "$OUTDIR"/up
chmod +x "$OUTDIR"/up

# down
cat "$WRAPS"/down.sh | sed "s#kubectl#$KUBECTL#g" > "$OUTDIR"/down
chmod +x "$OUTDIR"/down

# qstat
cat "$WRAPS"/qstat.sh | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-user#$NAMESPACE_USER#g" > "$OUTDIR"/qstat
chmod +x "$OUTDIR"/qstat

# qtop
cat "$WRAPS"/qtop.sh | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-user#$NAMESPACE_USER#g" > "$OUTDIR"/qtop
chmod +x "$OUTDIR"/qtop

# qls
cat "$WRAPS"/qls.sh | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/qls
chmod +x "$OUTDIR"/qls

# qcat
cat "$WRAPS"/qcat.sh | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/qcat
chmod +x "$OUTDIR"/qcat

# lunchpail controller logs
cat "$WRAPS"/logs/controllers/lunchpail.sh | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/logs/controllers/lunchpail
chmod +x "$OUTDIR"/logs/controllers/lunchpail

# workerpool logs
cat "$WRAPS"/logs/workers.sh | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/logs/workers
chmod +x "$OUTDIR"/logs/workers

# dispatcher logs
cat "$WRAPS"/logs/dispatcher.sh | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/logs/dispatcher
chmod +x "$OUTDIR"/logs/dispatcher
