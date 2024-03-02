#!/usr/bin/env bash
# we need bash for the indirect expansion ${!...}

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

if [[ -z "$REMOTE_PATH_VAR" ]]; then
    echo "Error: REMOTE_PATH_VAR not defined"
    exit 1
elif [[ -z ${!REMOTE_PATH_VAR} ]]; then
    echo "Error: ${!REMOTE_PATH_VAR} not defined"
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
remote=s3:/${!REMOTE_PATH_VAR}/$RUN_NAME/queues/$POOL.$JOB_COMPLETION_INDEX
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
    rclone --config $config delete $alive
}
trap cleanup INT TERM EXIT
rclone --config $config touch $alive

"$SCRIPTDIR"/get.sh $config $remote $local $inbox &
"$SCRIPTDIR"/put.sh $config $remote $local outbox &
"$SCRIPTDIR"/put.sh $config $remote $local processing &

wait