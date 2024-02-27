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

# first move from remote s3 to local storage *staging directory*
# then, we will do the atomic local move from staging to $local/$inbox
local_staging=$(mktemp -d)

echo "[workerpool s3-syncer-get $(basename $local)] Starting rclone get remote=$remote local=$local/$inbox"
while true; do
    # Intentionally sleeping at the beginning to give some time for
    # the worker's inotify to set itself up.
    # TODO: should the worker drop a "ready" file that we trigger on?
    sleep 5

    # 1) clear out local staging directory
    # 2) move from remote to local staging
    # 3) atomic move from local staging to local inbox
    rm -f $local_staging/*
    rclone --quiet --config $config --exclude '.alive' move $PROGRESS --create-empty-src-dirs $remote/$inbox $local_staging
    count=$(ls -1 $local_staging | wc -l)
    if [[ $count != 0 ]]
    then
        echo "[workerpool s3-syncer-get $(basename $local)] Moving cloned files from staging count=$count"
        mv $local_staging/* $local/$inbox
    fi

    new_size=$(ls -1 $local/$inbox | wc -l)
    if [[ $size != $new_size ]]; then
        size=$new_size
        report_size
    fi
done
