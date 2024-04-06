#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

echo "[workerpool s3-syncer-poststart $(basename $local)] begin"
rclone --config $config touch $alive
echo "[workerpool s3-syncer-poststart $(basename $local)] done"
