#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../hack/settings.sh

"$SCRIPTDIR"/charts/core/kustomize.sh $@
