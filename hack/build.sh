#!/bin/sh

set -e

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

if [ ! -f /tmp/lunchpail ]
then "$TOP"/hack/setup/cli.sh /tmp/lunchpail
fi

if [ -n "$CI" ]
then set -x
fi

/tmp/lunchpail images build $@
