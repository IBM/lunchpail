#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../../hack/settings.sh

# kill any test resources before we bring down controllers
"$SCRIPTDIR"/undeploy-tests.sh

# iterate over the shrinkwraps in reverse order, since the natural
# order will place preqreqs up front
if [[ -f "$SCRIPTDIR"/../../builds/dev/down ]]
then "$SCRIPTDIR"/../../builds/dev/down
fi
