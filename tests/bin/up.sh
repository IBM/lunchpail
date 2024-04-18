#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..
. "$SCRIPTDIR"/../../hack/settings.sh

if [[ "$LPC_ARGS" =~ "max" ]]
then BUILD_ARGS="--max"
fi

"$SCRIPTDIR"/../../hack/init.sh
"$SCRIPTDIR"/../../hack/build.sh $BUILD_ARGS

# in travis, we need to provide a special docker host
# TODO: is this for linux in general? for docker on linux in general?
if [[ -f /tmp/kindhack.yaml ]]
then
    docker_host_ip=$(docker network inspect kind | grep Gateway | awk 'FNR==1{gsub("\"", "",$2); print $2}' || echo nope)
    if [[ "$docker_host_ip" != nope ]]
    then
        echo "Hacking docker_host_ip=${docker_host_ip}"
        LPC_ARGS="$LPC_ARGS --docker-host=$docker_host_ip"
    fi
fi

NO_BUILD=1 "$TOP"/hack/update.sh $LPC_ARGS
"$SCRIPTDIR"/s3-copyin.sh
