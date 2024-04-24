#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

if [[ -f "$TOP"/builds/test/$(basename $1)/down ]]
then "$TOP"/builds/test/$(basename $1)/down
fi

rm -f /tmp/lunchpail

"$TOP"/hack/build.sh
"$SCRIPTDIR"/run.sh $1
