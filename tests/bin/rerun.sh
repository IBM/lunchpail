#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

if [[ -f "$TOP"/builds/test/$(basename $1)/down ]]
then "$TOP"/builds/test/$(basename $1)/down
fi

rm -f /tmp/lunchpail
if [ ${LUNCHPAIL_TARGET:-kubernetes} = "kubernetes" ]
then
    "$TOP"/hack/setup/cli.sh /tmp/lunchpail
    /tmp/lunchpail images build -v
    export LUNCHPAIL_BUILD_NOT_NEEDED=1
fi

"$SCRIPTDIR"/run.sh $1
