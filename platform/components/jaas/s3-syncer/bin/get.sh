#!/usr/bin/env sh

config=$1
remote=$2
local=$3
inbox=$4

mkdir -p $local/$inbox

# current number of entries in inbox
size=0

function report_size {
    echo "codeflare.dev queue $(basename $local) $inbox $size"
}

# initial report
report_size

if [[ -n "$DEBUG" ]]; then
    PROGRESS="--progress"
fi

echo "[workerpool s3-syncer-get $(basename $local)] Starting rclone get remote=$remote local=$local/$inbox"
while true; do
    # Intentionally sleeping at the beginning to give some time for
    # the worker's inotify to set itself up.
    # TODO: should the worker drop a "ready" file that we trigger on?
    sleep 5

    # Sync from remote to local
    rclone --quiet --config $config --exclude '.alive' sync $PROGRESS --create-empty-src-dirs $remote/$inbox $local/$inbox

    new_size=$(ls -1 $local/$inbox | wc -l)
    if [[ $size != $new_size ]]; then
        size=$new_size
        report_size
    fi
done
