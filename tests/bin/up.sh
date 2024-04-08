#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..
. "$SCRIPTDIR"/../../hack/settings.sh
. "$SCRIPTDIR"/../../hack/secrets.sh

LUNCHPAIL_PREP_INIT=1 "$SCRIPTDIR"/../../hack/init.sh
DOING_UP=1 NO_IMAGE_PUSH=1 "$SCRIPTDIR"/../../hack/build.sh $UP_FLAGS &
"$SCRIPTDIR"/down.sh & "$SCRIPTDIR"/../../hack/init.sh
wait
DOING_UP=1 ONLY_IMAGE_PUSH=1 "$SCRIPTDIR"/../../hack/build.sh $UP_FLAGS

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

NO_BUILD=1 "$TOP"/hack/update.sh
"$SCRIPTDIR"/s3-copyin.sh
