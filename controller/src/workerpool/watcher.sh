#!/usr/bin/env bash

set -eo pipefail

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
    while true
    do
        tasks=$(rclone --config $config lsf $remote/$inbox --files-only --exclude .alive)
        for task in $tasks
        do
            # TODO: re-check if task still exists in our inbox before
            # starting on it

            echo "[workerpool worker $JOB_COMPLETION_INDEX $config $remote/$inbox] rclone lsf task: $task" 1>&2

            if [[ -n "$task" ]]
            then
                in=$remote/$inbox/$task
                inprogress=$remote/$processing/$task
                out=$remote/$outbox/$task

                # capture exit code, stdout and stderr of the handler
                ec=$remote/$outbox/$task.code
                succeeded=$remote/$outbox/$task.succeeded
                failed=$remote/$outbox/$task.failed
                stdout=$remote/$outbox/$task.stdout
                stderr=$remote/$outbox/$task.stderr

                localinbox=$local/$inbox
                localprocessing=$local/$processing
                localoutbox=$local/$outbox
                localec=$localoutbox/$task.code
                localstdout=$localoutbox/$task.stdout
                localstderr=$localoutbox/$task.stderr

                mkdir -p $localinbox
                mkdir -p $localprocessing
                mkdir -p $localoutbox

                rclone --config $config copy $in $localprocessing
                echo "[workerpool worker $JOB_COMPLETION_INDEX] sending file to handler: $in"
                rm -f $localoutbox/$task
                rclone --config $config moveto $in $inprogress

                # signify that the process is still going... or prematurely terminated
                echo "-1" > "$localec"

                # record a sigterm/sigkill exit code
                trap "echo 137 > $localec" KILL
                trap "echo 143 > $localec" TERM

                ($handler $localprocessing/$task $localoutbox/$task | tee $localstdout) 3>&1 1>&2 2>&3 | tee $localstderr
                EC=$?
                echo "$EC" > "$localec"

                # remove sigterm/sigkill handlers
                trap "" KILL
                trap "" TERM
            
                rclone --config $config moveto $localec $ec
                rclone --config $config moveto $localstdout $stdout
                rclone --config $config moveto $localstderr $stderr

                if [[ $EC = 0 ]]
                then
                    rclone --config $config touch "$succeeded"
                    echo "[workerpool worker $JOB_COMPLETION_INDEX] handler success: $in"
                else
                    rclone --config $config touch "$failed"
                    echo "[workerpool worker $JOB_COMPLETION_INDEX] handler error with exit code $EC: $in"
                fi

                rclone --config $config moveto $inprogress $out
            fi
        done

        sleep 3
    done
}

if [ "$(uname -m)" = "x86_64" ]; then ARCH=amd64; else ARCH=arm64; fi
RCLONE=rclone-v1.66.0-linux-$ARCH
PATH="${HOME}/$RCLONE/":$PATH
if ! which rclone
then
    echo "Installing rclone" 1>&2
    os=$(cat /etc/os-release | grep ^ID= | awk -F= '{print $2}')
    if [ "$os" = "ubuntu" ] || [ "$os" = "debian" ]
    then
        if ! which curl
        then apt -y install curl ca-certificates unzip
        fi
        curl -LO https://downloads.rclone.org/v1.66.0/$RCLONE.zip
        unzip -o $RCLONE.zip -d ${HOME}
        rm -rf $RCLONE.zip
    elif [ "$os" = "alpine" ]
    then apk update && apk --no-cache add rclone
    fi
fi

if [[ -z "$TASKQUEUE_VAR" ]]; then
    echo "Error: TASKQUEUE_VAR not defined"
    exit 1
elif [[ -z "${!TASKQUEUE_VAR}" ]]; then
    echo "Error: ${!TASKQUEUE_VAR} not defined"
fi
if [[ -z "$AWS_ACCESS_KEY_ID_VAR" ]]; then
    echo "Error: AWS_ACCESS_KEY_ID_VAR not defined"
    exit 1
elif [[ -z "${!AWS_ACCESS_KEY_ID_VAR}" ]]; then
    echo "Error: ${!AWS_ACCESS_KEY_ID_VAR} not defined"
fi
if [[ -z "$AWS_SECRET_ACCESS_KEY_VAR" ]]; then
    echo "Error: AWS_SECRET_ACCESS_KEY_VAR not defined"
    exit 1
elif [[ -z "${!AWS_SECRET_ACCESS_KEY_VAR}" ]]; then
    echo "Error: ${!AWS_SECRET_ACCESS_KEY_VAR} not defined"
fi
if [[ -z "$RUN_NAME" ]]; then
    echo "Error: RUN_NAME not defined"
    exit 1
fi
if [[ -z "$JOB_COMPLETION_INDEX" ]]; then
    echo "Error: JOB_COMPLETION_INDEX not defined"
    exit 1
fi

# use pod name suffix hash from batch.v1/Job controller
suffix=$(sed -E 's/^.+-([^-]+)$/\1/' <<< $POD_NAME)
config=/tmp/rclone.conf
remote=s3:/${!TASKQUEUE_VAR}/$LUNCHPAIL/$RUN_NAME/queues/$POOL.w$JOB_COMPLETION_INDEX.$suffix
inbox=inbox
processing=processing
outbox=outbox
alive=$remote/$inbox/.alive
local=$WORKQUEUE/$JOB_COMPLETION_INDEX

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

echo "[workerpool worker $JOB_COMPLETION_INDEX] Delaying startup by $LUNCHPAIL_STARTUP_DELAY seconds"
sleep ${LUNCHPAIL_STARTUP_DELAY}

rclone --config $config touch $alive
start_watch
