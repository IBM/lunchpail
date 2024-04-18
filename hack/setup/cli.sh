#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

cd "$TOP"

DST=${1-/tmp/lunchpail}

msg="Downloading CLI dependencies"
if which gum > /dev/null 2>&1
then gum spin --show-output --title "$msg" -- go get ./...
else echo "$msg" && go get ./...
fi

msg="Integrating templates"
if which gum > /dev/null 2>&1
then gum spin --show-output --title "$msg" -- go generate ./...
else echo "$msg" && go generate ./...
fi


msg="Building CLI to $(tput setaf 5)$DST$(tput sgr0)"
if which gum > /dev/null 2>&1
then gum spin --show-output --title "$msg" -- bash -c "CGO_ENABLED=0 go build -ldflags='-s -w' -o $DST cmd/main.go"
else echo "$msg" && CGO_ENABLED=0 go build -ldflags="-s -w" -o "$DST" cmd/main.go
fi

echo "✅ Done"
ls -lh "$DST"
