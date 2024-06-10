#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

# kill any test resources before we bring down controllers
"$SCRIPTDIR"/undeploy-tests.sh

# iterate over the shrinkwraps in reverse order, since the natural
# order will place preqreqs up front
if [[ -f "$SCRIPTDIR"/../../builds/dev/down ]]
then "$SCRIPTDIR"/../../builds/dev/down
fi
