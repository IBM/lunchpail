#!/usr/bin/env sh

config=$1
remote=$2
local=$3
inbox=inbox

mkdir -p $local/$inbox

size=0

function report_size {
    echo "codeflare.dev queue $(basename $local) $inbox $size"
}

# initial report
report_size

if [[ -n "$DEBUG" ]]; then
    PROGRESS="--progress"
fi

echo "Starting rclone get remote=$remote local=$local/$inbox"
while true; do
    rclone --config $config move $PROGRESS --create-empty-src-dirs $remote/$inbox $local/$inbox

    new_size=$(ls $local/$inbox | wc -l)
    if [[ $size != $new_size ]]; then
        size=$new_size
        report_size
    fi
    
    sleep 5
done
