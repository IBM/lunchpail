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

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/shrinkwrap-helpers.sh

JAAS_FULL=${JAAS_FULL:-false}

while getopts "ab:cd:fh:ln:" opt
do
    case $opt in
        b) appbranch="-b ${OPTARG}"; continue;;
        d) OUTDIR=${OPTARG}; continue;;
        f) JAAS_FULL=true; continue;;
        a) APP_ONLY=true; continue;;
        c) CORE_ONLY=true; continue;;
        l) LITE=1; continue;;
        h) EXTRA_HELM_INSTALL_FLAGS="${OPTARG}"; continue;;
        n) APP_NAME=${OPTARG}; continue;;
    esac
done
shift $((OPTIND-1))
appgit=$1
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

if [[ -z "$APP_ONLY" ]]
then shrink_core
fi

if [[ -n "$appgit" ]] && [[ -z "$CORE_ONLY" ]]
then
    USERTMP=$(mktemp -d /tmp/lunchpail-shrink.XXXXXXXX)
    tar -C "$TOP"/platform/default-user -cf - . | tar -C "$USERTMP" -xf -

    copy_app $USERTMP $appgit "$appbranch" $APP_NAME
    shrink_user $USERTMP
fi

add_dir "$SCRIPTDIR"/shrinkwrap/scripts "$OUTDIR" $APP_NAME
