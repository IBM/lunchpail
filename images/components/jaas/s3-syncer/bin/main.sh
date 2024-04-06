#!/usr/bin/env bash
# we need bash for the indirect expansion ${!...}

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

# Delay if we were asked to do so by a spec.startupDelay in the
# associated WorkerPool
if [[ -n "$LUNCHPAIL_STARTUP_DELAY" ]] && [[ "LUNCHPAIL_STARTUP_DELAY" != 0 ]]
then
    echo "[workerpool s3-syncer-main $(basename $local)] Delaying startup by $LUNCHPAIL_STARTUP_DELAY seconds"
    sleep ${LUNCHPAIL_STARTUP_DELAY}
fi

# Listen for new work on `inbox`, finished work on `outbox`, and
# in-progress work on `processing`
"$SCRIPTDIR"/sync.sh $config $remote $local $inbox processing outbox
