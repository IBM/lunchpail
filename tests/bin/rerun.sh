#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

"$TOP"/hack/build.sh -l > /dev/null &

if [[ -f "$TOP"/builds/test/$(basename $1)/down ]]
then "$TOP"/builds/test/$(basename $1)/down
fi

"$TOP"/builds/lite/down
"$TOP"/hack/shrinkcore.sh "$TOP"/builds

wait

"$TOP"/builds/lite/up

"$SCRIPTDIR"/run.sh $1
