#!/bin/sh

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

for os in darwin linux
do
    for arch in amd64 arm64
    do
        GOOS=$os GOARCH=$arch "$SCRIPTDIR"/cli.sh lunchpail-$os-$arch
    done
done
