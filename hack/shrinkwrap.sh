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

QUIET="-q"
JAAS_FULL=${JAAS_FULL:-false}

while getopts "ab:cd:fgh:ln:" opt
do
    case $opt in
        b) appbranch="-b ${OPTARG}"; continue;;
        d) OUTDIR=${OPTARG}; continue;;
        f) JAAS_FULL=true; continue;;
        g) DEBUG=true; QUIET=""; continue;;
        a) APP_ONLY=true; continue;;
        c) CORE_ONLY=true; continue;;
        l) LITE=1; continue;;
        h) EXTRA_HELM_INSTALL_FLAGS="${OPTARG}"; continue;;
        n) APP_NAME=${OPTARG}; continue;;
    esac
done
appgit=${@:$((OPTIND))}
OPTIND=1

if [[ -n "$OUTDIR" ]]
then
    echo "📦 Shrinkwrapping to $OUTDIR"
    CORE="$OUTDIR"/02-jaas.yml
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

if [[ -n "$DEBUG" ]]
then echo "$(tput setaf 2)Final shrinkwrap HELM_INSTALL_FLAGS=$HELM_INSTALL_FLAGS$(tput sgr0)"
fi

if [[ -z "$APP_ONLY" ]]
then shrink_core
fi

if [[ -n "$appgit" ]] && [[ -z "$CORE_ONLY" ]]
then
    USERTMP=$(mktemp -d /tmp/$(basename "${appgit%%.git}")-stage.XXXXXXXX)
    tar --exclude '*~' -C "$TOP"/platform/default-user -cf - . | tar -C "$USERTMP" -xf -

    if [[ -n "$DEBUG" ]]
    then echo "$(tput setaf 33)Staging to $USERTMP$(tput sgr0)"
    else trap "rm -rf $USERTMP" EXIT
    fi

    copy_app $USERTMP $appgit "$appbranch" $APP_NAME
    shrink_user $USERTMP
fi

add_dir "$SCRIPTDIR"/shrinkwrap/scripts "$OUTDIR" $APP_NAME
