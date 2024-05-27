#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
cd "$SCRIPTDIR"/../..

echo "Checking go fmt..."
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

echo "Running go tests..."
./hack/setup/cli.sh
go test -timeout=0 -v ./...

# Note go vet requires go generate, which is done by hack/setup/cli.sh (above)
echo "Checking go vet..."
go vet ./...
echo "✅ PASS: go vet looks good"
