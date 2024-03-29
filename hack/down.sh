#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

# kill any test resources before we bring down controllers
"$SCRIPTDIR"/../tests/bin/undeploy-tests.sh

# iterate over the shrinkwraps in reverse order, since the natural
# order will place preqreqs up front
if [[ -f "$SCRIPTDIR"/../builds/dev/down ]]
then "$SCRIPTDIR"/../builds/dev/down
fi
