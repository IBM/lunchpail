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

if [[ -f "$SCRIPTDIR"/my.secrets.sh ]]
then
    echo "Injecting your secrets"
    . "$SCRIPTDIR"/my.secrets.sh
fi

set -x
"$TOP"/hack/shrinkapp.sh \
      $branch \
      -o "$TARGET" \
      -a "${4-$1}" \
      $APP \
      $GPU \
      $LPA_ARGS \
      --set global.arch=$ARCH \
      --set kubernetes.context=kind-jaas \
      --set kubernetes.config=$(kubectl config view  -o json --flatten | base64 | tr -d '\n') \
      --set cosAccessKey=$COS_ACCESS_KEY \
      --set cosSecretKey=$COS_SECRET_KEY \
      --set github_ibm_com.secret.user=$AI_FOUNDATION_GITHUB_USER \
      --set github_ibm_com.secret.pat=$AI_FOUNDATION_GITHUB_PAT \
      "$2"

"$TARGET"/up
