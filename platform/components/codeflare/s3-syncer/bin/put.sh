#!/usr/bin/env sh

config=$1
remote=$2
local=$3
outbox=$4

mkdir -p $local/$outbox

size=0

function report_size {
    echo "codeflare.dev queue $(basename $local) $outbox $size"
}

# initial report_size
report_size

if [[ -n "$DEBUG" ]]; then
    PROGRESS="--progress"
fi

echo "Starting rclone put remote=$remote local=$local/$outbox"
while true; do
    if [[ -d $local/$outbox ]]; then
        rclone --config $config sync $PROGRESS $local/$outbox $remote/$outbox
 
        new_size=$(ls $local/$outbox | wc -l)
        if [[ $size != $new_size ]]; then
            size=$new_size
            report_size
        fi
    fi

    sleep 5
done
