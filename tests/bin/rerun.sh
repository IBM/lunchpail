#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

"$TOP"/hack/build.sh -l > /dev/null &

"$TOP"/builds/test/$(basename $1)/down
"$TOP"/builds/lite/down
"$TOP"/hack/shrinkcore.sh "$TOP"/builds

wait

"$TOP"/builds/lite/up

"$SCRIPTDIR"/run.sh $1
