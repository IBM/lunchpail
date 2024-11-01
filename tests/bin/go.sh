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

if [ -z "$LUNCHPAIL_BUILD_NOT_NEEDED" ]
then ./hack/setup/cli.sh
fi

echo "Running go tests..."
go test -timeout=0 -v ./...

# Note go vet requires go generate, which is done by hack/setup/cli.sh (above)
echo "Checking go vet..."
go vet ./...
echo "✅ PASS: go vet looks good"

echo "Checking for context.Background|TODO in pkg"
if grep --include '*.go' -Er 'context.[TB]' pkg/
then echo "❌ FAIL: found calls to context.TODO or context.Background in pkg/"
else echo "✅ PASS: found no calls to context.TODO or context.Background in pkg/"
fi
