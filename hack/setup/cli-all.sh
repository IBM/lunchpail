#!/bin/sh

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

msg="Downloading CLI dependencies"
echo "$msg" && go get ./...

# We need two passes of `go generate`
#   - pass 1 to generate base bits (version.txt, etc.)
#   - pass 2 to include base bits in the lunchpail-source.tar.gz bit
msg="Integrating templates"
echo "$msg" && go generate ./... && go generate ./...

for os in darwin linux
do
    for arch in amd64 arm64
    do
        echo "Building CLI os=$os arch=$arch"
        GOOS=$os GOARCH=$arch CGO_ENABLED=0 go build -ldflags="-s -w" -o lunchpail-$os-$arch cmd/main.go &
    done
done

wait
echo "Done"
