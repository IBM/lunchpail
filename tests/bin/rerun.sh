#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

if [[ -f "$TOP"/builds/test/$(basename $1)/down ]]
then "$TOP"/builds/test/$(basename $1)/down
fi

rm -f /tmp/lunchpail
"$TOP"/hack/setup/cli.sh /tmp/lunchpail
export LUNCHPAIL_SKIP_CLI_BUILD=1
if [ "${LUNCHPAIL_TARGET:-kubernetes}" = "kubernetes" ]
then /tmp/lunchpail images build -v
fi

"$SCRIPTDIR"/run.sh $1
