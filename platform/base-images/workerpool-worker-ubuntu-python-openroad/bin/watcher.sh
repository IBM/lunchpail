#!/usr/bin/env bash

# this worker will watch the subdirectory inbox given by its worker index
inbox="$JOB_COMPLETION_INDEX/inbox"
processing="$JOB_COMPLETION_INDEX/processing"
outbox="$JOB_COMPLETION_INDEX/outbox"
queue="$WORKQUEUE/$inbox"

# this is the handler that will be called for each task
handler="$@"

if [[ -z "$WORKQUEUE" ]]; then
    echo "[workerpool worker $JOB_COMPLETION_INDEX] Error: WORKQUEUE filepath not defined" 1>&2
    exit 1
elif [[ ! -e "$WORKQUEUE" ]]; then
    echo "[workerpool worker $JOB_COMPLETION_INDEX] Error: WORKQUEUE filepath does not exist: $WORKQUEUE" 1>&2
    exit 1
elif [[ ! -d "$WORKQUEUE" ]]; then
    echo "[workerpool worker $JOB_COMPLETION_INDEX] Error: WORKQUEUE filepath is not a directory: $WORKQUEUE" 1>&2
    exit 1
fi

if [[ -z "$handler" ]]; then
    echo "[workerpool worker $JOB_COMPLETION_INDEX] Error: Missing task handler" 1>&2
    exit 1
fi

function start_watch {
    queue=$1

    if [[ ! -e "$queue" ]]; then
        echo "[workerpool worker $JOB_COMPLETION_INDEX] Error: queue filepath does not exist: $queue" 1>&2
        exit 1
    elif [[ ! -d "$queue" ]]; then
        echo "[workerpool worker $JOB_COMPLETION_INDEX] Error: queue filepath is not a directory: $queue" 1>&2
        exit 1
    fi

    echo "[workerpool worker $JOB_COMPLETION_INDEX] Watching $queue" 1>&2

    inotifywait -m -e create -e moved_to --exclude .partial $queue |
        while read directory action file
        do
            in=$queue/$file
            inprogress=$WORKQUEUE/$processing/$file
            out=$WORKQUEUE/$outbox/$file
            $handler $in $inprogress $out
        done
}

# Check to see if the queue directory exists; Note: I don't think we
# can *only* use inotifywait here to get notified of directory
# existence, as there is a race window. So, for now, we just
# poll. This only needs to poll until the s3-syncer sidecar gets its
# act in gear.
until [[ -e "$queue" ]]
do
    echo "[workerpool worker $JOB_COMPLETION_INDEX] Waiting for queue directory to exist: $queue" 1>&2
    sleep 1
done

start_watch $queue
