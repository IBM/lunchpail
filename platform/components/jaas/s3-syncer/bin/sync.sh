#!/usr/bin/env sh

config=$1
remote=$2
local=$3
inbox=$4
processing=$5
outbox=$6
justonce=$7

mkdir -p $local/$inbox
mkdir -p $local/$processing
mkdir -p $local/$outbox

# current number of entries in boxes
isize=0
psize=0
osize=0

function report_size {
    echo "lunchpail.io queue $(basename $local) $1 $2"
}

# initial report
report_size $inbox 0
report_size $processing 0
report_size $outbox 0

if [[ -n "$DEBUG" ]]; then
    PROGRESS="--progress"
fi

function syncDeletes {
    for f in $local/$2/*
    do
        if [[ ! -e $local/$1/$(basename $f) ]]
        then rclone --quiet --config $config deletefile $remote/$1/$(basename $f)
        fi
    done
}

echo "[workerpool s3-syncer-get $(basename $local)] Starting rclone get remote=$remote local=$local/$inbox"
while true; do
    # Intentionally sleeping at the beginning to give some time for
    # the worker's inotify to set itself up.
    # TODO: should the worker drop a "ready" file that we trigger on?
    sleep 5

    # Sync any deletes from local to remote
    syncDeletes $inbox $processing
    syncDeletes $processing $outbox

    # Sync from remote inbox to local inbox
    if [[ -z "$justonce" ]]
    then rclone --quiet --config $config --exclude '.alive' sync $PROGRESS --create-empty-src-dirs $remote/$inbox $local/$inbox
    fi

    # Sync from local outbox to remote outbox
    rclone --config $config sync $PROGRESS --create-empty-src-dirs $local/$outbox $remote/$outbox

    new_size=$(ls -1 $local/$inbox | wc -l)
    if [[ $isize != $new_size ]]; then
        isize=$new_size
        report_size $inbox $isize
    fi

    new_size=$(ls -1 $local/$processing | wc -l)
    if [[ $psize != $new_size ]]; then
        psize=$new_size
        report_size $processing $psize
    fi

    new_size=$(ls $local/$outbox | grep -Evs '(\.code|\.stderr|\.stdout)$' | wc -l | xargs)
    if [[ $osize != $new_size ]]; then
        osize=$new_size
        report_size $outbox $osize
    fi

    if [[ -n "$justonce" ]]
    then break
    fi
done
