#!/usr/bin/env bash

set -e
set -o pipefail

#
# $1: test name
# $2: app path, either a local filepath or a git uri
# $3: [git branch]
# $4: [deploy name] e.g. if we call it test8, but the git repo calls it something else; this is the something else
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..
. "$TOP"/hack/settings.sh
. "$TOP"/hack/secrets.sh

if [[ -n $1 ]]; then
    APP="--set app=$1"
fi

if which lspci && lspci | grep -iq nvidia; then
    echo "$(tput setaf 2)Detected GPU support for arch=$ARCH$(tput sgr0)"
    GPU="--set supportsGpu=true"
fi

TARGET="$TOP"/builds/test/$1
rm -rf "$TARGET"

echo "$(tput setaf 2)Deploying test Runs for arch=$ARCH$(tput sgr0) target=$TARGET $HELM_INSTALL_FLAGS"

if [[ -n "$3" ]]
then branch="-b $3"
fi

"$TOP"/hack/shrinkwrap.sh \
      -a \
      $branch \
      -d "$TARGET" \
      -n "${4-$1}" \
      -h "$APP $GPU --set nfs.enabled=$NEEDS_NFS --set global.arch=$ARCH $APP $GPU --set kubernetes.context=kind-jaas --set kubernetes.config=$($KUBECTL config view  -o json --flatten | base64 | tr -d '\n') $HELM_SECRETS $HELM_INSTALL_FLAGS $HELM_IMAGE_PULL_SECRETS" \
      "$2"

"$TARGET"/up
