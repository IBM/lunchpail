#!/bin/sh

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

exec "$SCRIPTDIR"/shrinkwrap.sh -l -a $@
