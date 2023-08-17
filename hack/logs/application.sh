#!/usr/bin/env bash

set -e
set -o pipefail

NO_GETOPTS=1
SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/../settings.sh

$KUBECTL logs -n codeflare-system -l app.kubernetes.io/component=application-controller $@

