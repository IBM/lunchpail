#!/bin/sh

set -e

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

if [ ! -f /tmp/lunchpail ]
then "$TOP"/hack/setup/cli.sh /tmp/lunchpail
fi

/tmp/lunchpail init local
/tmp/lunchpail images build $BUILD_ARGS
