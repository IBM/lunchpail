#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..
. "$SCRIPTDIR"/../../hack/settings.sh

"$SCRIPTDIR"/../../hack/init.sh
"$SCRIPTDIR"/../../hack/build.sh $BUILD_ARGS
