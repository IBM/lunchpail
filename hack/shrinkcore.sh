#!/bin/sh

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

if [[ -z "$1" ]]
then
    echo "Usage: shrinkcore <targetdir>" 1>&2
    exit 1
fi

"$SCRIPTDIR"/shrinkwrap.sh -l -c -d $1/lite
NEEDS_CSI_S3=true "$SCRIPTDIR"/shrinkwrap.sh -l -c -d $1/s3mounts
NEEDS_CSI_S3=true "$SCRIPTDIR"/shrinkwrap.sh -f -c -d $1/full
