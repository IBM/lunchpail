#!/bin/sh

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

if [ -z "$1" ]
then
    echo "Usage: shrinkcore <targetdir>" 1>&2
    exit 1
fi

OUTDIR="$TOP"/builds
mkdir -p "$OUTDIR/lite"
mkdir -p "$OUTDIR/s3mounts"
mkdir -p "$OUTDIR/full"

if [ ! -f /tmp/lunchpail ]
then "$TOP"/hack/setup/cli.sh /tmp/lunchpail
fi

/tmp/lunchpail shrinkwrap core -o "$OUTDIR"/lite/02-jaas.yml $LP_ARGS
#/tmp/lunchpail shrinkwrap core -o "$OUTDIR"/s3mounts/02-jaas.yml $LP_ARGS
/tmp/lunchpail shrinkwrap core --max -o "$OUTDIR"/full/02-jaas.yml $LP_ARGS
