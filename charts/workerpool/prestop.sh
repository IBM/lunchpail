#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

PATH="${HOME}/rclone-v1.66.0-linux-$(uname -m)/":$PATH

function cleanup {
    echo "[workerpool app $(basename $local)] Terminating..."

    # deregister ourselves as a live worker
    rclone --config $config delete $alive

    # register ourselves as a dead worker
    rclone --config $config touch $dead
}

echo "[workerpool prestop $(basename $local)] begin"
cleanup
echo "[workerpool prestop $(basename $local)] end"
