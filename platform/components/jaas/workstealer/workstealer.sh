#!/usr/bin/env bash

LOCAL_QUEUE_ROOT=$(mktemp -d)
QUEUE_PATH=${!REMOTE_PATH_VAR}/$RUN_NAME
export QUEUE=$LOCAL_QUEUE_ROOT/$QUEUE_PATH

echo "Workstealer starting QUEUE=$QUEUE"
printenv

config=/tmp/rclone.conf
remote=s3:/$QUEUE_PATH

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

# otherwise inotifywait won't have an inode to watch...
mkdir -p $QUEUE

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
(inotifywait -r -m -e create -e moved_to $QUEUE |
     while read directory action file
     do
         echo "Launching workstealer processor due to change directory=$directory action=$action file=$file"
         "$SCRIPTDIR"/workstealer
     done
) &

while true
do
    rclone --config /tmp/rclone.conf bisync --resync $remote $QUEUE
    sleep ${QUEUE_POLL_INTERVAL_SECONDS:-3}
done
