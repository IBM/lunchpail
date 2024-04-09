#!/bin/sh

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

OUTDIR="$TOP"/builds
mkdir -p "$OUTDIR/core"

if [ ! -f /tmp/lunchpail ]
then "$TOP"/hack/setup/cli.sh /tmp/lunchpail
fi

if [ -n "$CI" ]
then set -x
fi

/tmp/lunchpail shrinkwrap core -o "$OUTDIR"/core/02-jaas.yml $@
