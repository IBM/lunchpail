#!/usr/bin/env bash

set -e
set -o pipefail

NO_GETOPTS=1
SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../settings.sh

$KUBECTL logs -l name=dataset-operator --tail -1 -c dataset-operator $@

