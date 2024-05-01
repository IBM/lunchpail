#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

LOCAL_QUEUE_ROOT=$(mktemp -d /tmp/localqueue.XXXXXXXX)
QUEUE_BUCKET=${!TASKQUEUE_VAR}
QUEUE_PATH=$QUEUE_BUCKET/$LUNCHPAIL/$RUN_NAME
export QUEUE=$LOCAL_QUEUE_ROOT/$QUEUE_PATH

echo "Workstealer starting QUEUE=$QUEUE"
printenv

config=/tmp/rclone.conf
remote=s3:/$QUEUE_PATH

# the rclone.conf file
cat <<EOF > $config
[s3]
type = s3
provider = Other
env_auth = false
endpoint = ${!S3_ENDPOINT_VAR}
access_key_id = ${!AWS_ACCESS_KEY_ID_VAR}
secret_access_key = ${!AWS_SECRET_ACCESS_KEY_VAR}
acl = public-read
EOF

# Upload a file `$1` to the remote
function upload {
    local file=$1
    remotefile=s3:$(echo $file | sed -E "s#^$LOCAL_QUEUE_ROOT/##")
    echo "Uploading changed file: $file -> $remotefile"
    rclone --config $config copyto --retries 20 --retries-sleep=1s $file $remotefile &
}

# Delete a file `$1` on the remote
function move {
    local src=$1
    local dst=$2
    remoteSrc=s3:$(echo $src | sed -E "s#^$LOCAL_QUEUE_ROOT/##")
    remoteDst=s3:$(echo $dst | sed -E "s#^$LOCAL_QUEUE_ROOT/##")
    echo "Moving file: $remoteSrc $remoteDst"
    rclone --config $config moveto --retries 20 --retries-sleep=1s $remoteSrc $remoteDst &
}

# Capture state of files
function capture {
    if [[ -d $QUEUE ]]
    then (cd $QUEUE && find * | sort > $1)
    else echo "" > $1
    fi
}

# Poll for changes to the remote, using `rclone sync` to copy them
# locally. Then, the above inotifywait will be ... notified and then
# react to those changes.
idx=1

# We will do an B/A comparison (Before/After) of the queue files
B=$(mktemp /tmp/before.$idx.XXXXXXXXXXXX)

rclone --config $config mkdir s3:$QUEUE_BUCKET

while true
do
    if [[ -f $A ]]; then rm -f $A; fi
    A=$(mktemp /tmp/after.$idx.XXXXXXXXXXXX)
    idx=$((idx+1))

    # Capture Before files...
    capture $B

    # Sync in changes from remote
    rclone --config $config sync --create-empty-src-dirs --retries 20 --retries-sleep=1s --exclude '*.partial' $remote $QUEUE

    if [[ $? != 0 ]]
    then
        # Then the rclone sync failed
        echo "Error with rclone sync. Nuking local clone to start from scratch. Diagnostics follow:"

        echo "------------------ cloned tree of local=$QUEUE ------------------"
        find "$QUEUE"

        echo "------------------ rclone tree of remote=$remote ------------------"
        rclone --config $config tree $remote

        rm -rf "$QUEUE"
    else
        # Capture After files...
        capture $A

        beforesum=$(sha256sum $B | awk '{print $1}')
        aftersum=$(sha256sum $A | awk '{print $1}')
        if [[ $beforesum != $aftersum ]]
        then
            # Then we sync'd in some updates. Launch the go code, which
            # will emit a newline-separated stream of files it has
            # changed; here we react to those changes by uploading back to
            # the remote using rclone operations

            echo "🚀 Launching workstealer processor due to these changes iter=$idx:"
            diff --new-line-format='+%L' --old-line-format='-%L' --unchanged-line-format=' %L' $B $A # to improve debuggability, report diff to stdout

            # Note re: the line-format; the default behavior of both
            # busybox diff and GNU diff is to ignore some
            # non-changes. Honestly, I don't know the semantics of
            # what is ignored, but I think they do not report (by
            # default) trailing non-changes. With this combination of
            # line-formats, we are assured to get a line report for
            # every line of both files.
            
            # And also stream the diff to stdin of the go code
            diff --new-line-format='+%L' --old-line-format='-%L' --unchanged-line-format=' %L' $B $A | "$SCRIPTDIR"/workstealer | while read file file2 change
            do
                if [[ "$change" = move ]]
                then move $file $file2
                elif [[ "$change" = link ]]
                then upload $file2
                else
                  upload $file
                fi
            done
        fi
    fi

    sleep ${QUEUE_POLL_INTERVAL_SECONDS:-3}

    rm -f $B
    B=$(mktemp /tmp/before.$idx.XXXXXXXXXXXX)
done
