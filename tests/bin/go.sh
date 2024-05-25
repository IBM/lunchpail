#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
cd "$SCRIPTDIR"/../..

echo "Checking for PR forgetting to run go fmt..."
if [[ $(gofmt -d cmd pkg | wc -l | xargs) != 0 ]]
then
    echo "❌ FAIL: please run 'go fmt ./...'"
    echo "Here are the files that need formatting:"
    go fmt ./...
    git status
    exit 1
else
    echo "✅ PASS: go fmt looks good"
fi

# TODO run go vet

./hack/setup/cli.sh
go test -timeout=0 -v ./...
