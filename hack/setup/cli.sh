#!/bin/sh

set -e

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

TOP="$SCRIPTDIR"/../..
if [[ -d ./cmd ]]
then TOP=$(pwd)
fi

cd "$TOP"

DST=${1-./lunchpail}

msg="Downloading CLI dependencies"
echo "$msg" && go get ./...

# We need two passes of `go generate`
#   - pass 1 to generate base bits (version.txt, etc.)
#   - pass 2 to include base bits in the lunchpail-source.tar.gz bit
msg="Integrating templates"
echo "$msg" && go generate ./... && go generate ./...

msg="Building CLI to $DST"
echo "$msg" && CGO_ENABLED=0 go build -tags full -ldflags="-s -w" -o "$DST" cmd/main.go

echo "✅ Done"
ls -lh "$DST"
