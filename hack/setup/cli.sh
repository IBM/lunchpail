#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

cd "$TOP"

DST=${1-/tmp/lunchpail}

msg="Downloading CLI dependencies"
echo "$msg" && go get ./...

msg="Integrating templates"
echo "$msg" && go generate ./...

msg="Building CLI to $(tput setaf 5)$DST$(tput sgr0)"
echo "$msg" && CGO_ENABLED=0 go build -ldflags="-s -w" -o "$DST" cmd/main.go

echo "✅ Done"
ls -lh "$DST"
