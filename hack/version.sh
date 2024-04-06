#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

grep appVersion "$SCRIPTDIR"/../templates/core/Chart.yaml  | awk '{gsub("\"", "", $2); print $2}'
