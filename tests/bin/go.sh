#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

cd "$SCRIPTDIR"/../..
./hack/setup/cli.sh
go test -timeout=0 -v ./...