#!/bin/sh

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

watch -c "$SCRIPTDIR"/../cpu/workers
