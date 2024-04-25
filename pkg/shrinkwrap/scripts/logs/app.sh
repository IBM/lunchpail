#!/bin/sh

#
# Stream out both dispatcher and worker logs
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

trap "pkill -P $$" EXIT

("$SCRIPTDIR"/dispatcher | while read line; do echo -e "\x1b[35m[dispatcher]\x1b[0m $line"; done) &
"$SCRIPTDIR"/workers | while read line; do echo -e "\x1b[33m[workers]\x1b[0m $line"; done
