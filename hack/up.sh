#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh
. "$SCRIPTDIR"/secrets.sh

LUNCHPAIL_PREP_INIT=1 "$SCRIPTDIR"/init.sh
DOING_UP=1 NO_IMAGE_PUSH=1 "$SCRIPTDIR"/build.sh &
"$SCRIPTDIR"/down.sh & "$SCRIPTDIR"/init.sh
wait
DOING_UP=1 ONLY_IMAGE_PUSH=1 "$SCRIPTDIR"/build.sh

# in travis, we need to provide a special docker host
# TODO: is this for linux in general? for docker on linux in general?
if [[ -f /tmp/kindhack.yaml ]]
then
    docker_host_ip=$(docker network inspect kind | grep Gateway | awk 'FNR==1{gsub("\"", "",$2); print $2}' || echo nope)
    if [[ "$docker_host_ip" != nope ]]
    then
        echo "Hacking docker_host_ip=${docker_host_ip}"
        HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS --set global.dockerHost=${docker_host_ip}"
    fi
fi

echo "$(tput setaf 2)Creating shrinkwraps JAAS_FULL=$JAAS_FULL base-HELM_INSTALL_FLAGS=$HELM_INSTALL_FLAGS$(tput sgr0)"
HELM_INSTALL_FLAGS=$HELM_INSTALL_FLAGS HELM_DEPENDENCY_DONE=1 "$SCRIPTDIR"/shrinkwrap.sh -c -d "$SCRIPTDIR"/../builds/dev

"$SCRIPTDIR"/../builds/dev/up

"$SCRIPTDIR"/s3-copyin.sh
