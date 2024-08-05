#!/usr/bin/env bash

set -o allexport

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

LOCAL_QUEUE_ROOT=$(mktemp -d /tmp/localqueue.XXXXXXXX)
export QUEUE=$LOCAL_QUEUE_ROOT/$LUNCHPAIL_QUEUE_PATH

remote=s3:/$LUNCHPAIL_QUEUE_PATH

S3_ENDPOINT=http://localhost:9000

if [[ -z "$MINIO_ENABLED" ]]
then S3_ENDPOINT=$lunchpail_queue_endpoint
fi

# the rclone.conf file
config=~/.config/rclone/rclone.conf
mkdir -p $(dirname $config)
cat <<EOF > $config
[s3]
type = s3
provider = Other
env_auth = false
endpoint = $S3_ENDPOINT
access_key_id = $lunchpail_queue_accessKeyID
secret_access_key = $lunchpail_queue_secretAccessKey
acl = public-read
EOF

# Note how we tee to stdout and also pipe it to a logs file in the remote
"$SCRIPTDIR"/workstealer.sh | tee >(rclone rcat $remote/logs/workstealer.txt)
