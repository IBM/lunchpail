#!/usr/bin/env bash
# we need bash for the indirect expansion ${!...}

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

if [[ -z "$TASKQUEUE_VAR" ]]; then
    echo "Error: TASKQUEUE_VAR not defined"
    exit 1
elif [[ -z ${!TASKQUEUE_VAR} ]]; then
    echo "Error: ${!TASKQUEUE_VAR} not defined"
fi

if [[ -z "$AWS_ACCESS_KEY_ID_VAR" ]]; then
    echo "Error: AWS_ACCESS_KEY_ID_VAR not defined"
    exit 1
elif [[ -z ${!AWS_ACCESS_KEY_ID_VAR} ]]; then
    echo "Error: ${!AWS_ACCESS_KEY_ID_VAR} not defined"
fi

if [[ -z "$AWS_SECRET_ACCESS_KEY_VAR" ]]; then
    echo "Error: AWS_SECRET_ACCESS_KEY_VAR not defined"
    exit 1
elif [[ -z ${!AWS_SECRET_ACCESS_KEY_VAR} ]]; then
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

config=/tmp/rclone.conf
remote=s3:/${!TASKQUEUE_VAR}/$LUNCHPAIL/$RUN_NAME/queues/$POOL.$JOB_COMPLETION_INDEX
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

# signify that we are alive and well, and clean up on exit
inbox=inbox
alive=$remote/$inbox/.alive
function cleanup {
    echo "[workerpool s3-syncer-main $(basename $local)] Terminating..."

    # deregister ourselves as a live worker
    rclone --config $config delete $alive

    # one last upload...
    "$SCRIPTDIR"/sync.sh $config $remote $local $inbox processing outbox 1
}
trap cleanup INT TERM EXIT

# Delay if we were asked to do so by a spec.startupDelay in the
# associated WorkerPool
if [[ -n "$LUNCHPAIL_STARTUP_DELAY" ]] && [[ "LUNCHPAIL_STARTUP_DELAY" != 0 ]]
then
    echo "[workerpool s3-syncer-main $(basename $local)] Delaying startup by $LUNCHPAIL_STARTUP_DELAY seconds"
    sleep ${LUNCHPAIL_STARTUP_DELAY}
fi

# Now tell the world we are ready to accept load
rclone --config $config touch $alive

# Listen for new work on `inbox`, finished work on `outbox`, and
# in-progress work on `processing`
"$SCRIPTDIR"/sync.sh $config $remote $local $inbox processing outbox
