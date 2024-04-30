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

if [[ -n "$1" ]]
then APP="--set app=$1"
fi

if [[ -n "$taskqueue" ]]
then QUEUE="--queue $taskqueue"
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

# in travis, we need to provide a special docker host
# TODO: is this for linux in general? for docker on linux in general?
if [[ -f /tmp/kindhack.yaml ]]
then
    docker_host_ip=$(docker network inspect kind | grep Gateway | awk 'FNR==1{gsub("\"", "",$2); print $2}' || echo nope)
    if [[ "$docker_host_ip" != nope ]]
    then
        echo "Hacking docker_host_ip=${docker_host_ip}"
        LP_ARGS="$LP_ARGS --docker-host=$docker_host_ip"
    fi
fi

"$TOP"/hack/setup/cli.sh /tmp/lunchpail

testapp=$(mktemp)

# intentionally setting some critical values at assemble time to the
# final value, and some critical values to bogus values that are then
# overridden by final values at shrinkwrap time
/tmp/lunchpail assemble -v \
               -a "${4-$1}" \
               -o $testapp \
               $branch \
               --set github_ibm_com.secret.user=$AI_FOUNDATION_GITHUB_USER \
               --set github_ibm_com.secret.pat=BOGUSBOGUSBOGUS \
               $2

$testapp shrinkwrap \
         -v \
         -o "$TARGET" \
         $QUEUE \
         $APP \
         $GPU \
         $LP_ARGS \
         --set global.arch=$ARCH \
         --set kubernetes.context=kind-jaas \
         --set kubernetes.config=$(kubectl config view  -o json --flatten | base64 | tr -d '\n') \
         --set cosAccessKey=$COS_ACCESS_KEY \
         --set cosSecretKey=$COS_SECRET_KEY \
         --set github_ibm_com.secret.pat=$AI_FOUNDATION_GITHUB_PAT

"$TARGET"/up
