#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

"$TOP"/hack/build.sh -l > /dev/null &

if [[ -f "$TOP"/builds/lite/down ]]
then "$TOP"/builds/lite/down
fi

"$TOP"/hack/shrinkcore.sh "$TOP"/builds

wait

"$TOP"/builds/lite/up