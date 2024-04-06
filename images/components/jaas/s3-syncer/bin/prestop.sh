#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

function cleanup {
    echo "[workerpool s3-syncer-main $(basename $local)] Terminating..."

    # deregister ourselves as a live worker
    rclone --config $config delete $alive

    # register ourselves as a dead worker
    rclone --config $config touch $dead

    # one last upload...
    "$SCRIPTDIR"/sync.sh $config $remote $local $inbox processing outbox 1
}

echo "[workerpool s3-syncer-prestop $(basename $local)] begin"
cleanup
echo "[workerpool s3-syncer-prestop $(basename $local)] end"
