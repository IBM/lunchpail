#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/secrets.sh
. "$SCRIPTDIR"/settings.sh

"$SCRIPTDIR"/down.sh & "$SCRIPTDIR"/init.sh
wait
"$SCRIPTDIR"/build.sh

echo "$(tput setaf 2)Booting CodeFlare$(tput sgr0)"
helm install $PLA platform $HELM_SECRETS && \
    helm install $IBM ibm && \
    helm install $RUN tests/run
