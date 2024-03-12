#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

LOCAL_QUEUE_ROOT=$(mktemp -d)
QUEUE_PATH=${!REMOTE_PATH_VAR}/$RUN_NAME
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

# We need to do this up front, otherwise inotifywait won't have an
# inode to watch
mkdir -p $QUEUE

# -r: look recursively for changes
# -m: keep on watching ("monitor" mode)
# -e create: tell us when a file is created
# -e moved_to: tell us when a file is renamed
# -e delete: tell us when a file is deleted
(inotifywait -r -m -e create -e moved_to -e delete $QUEUE |
     while read directory action file
     do
         if [[ "$action" = "CREATE,ISDIR" ]]
         then continue
         elif [[ "$file" =~ ".lock" ]]
         then continue
         elif [[ "$file" =~ ".done" ]]
         then continue
         elif [[ "$file" =~ ".partial" ]]
         then continue
         fi

         # Launch the go code, which will emit a newline-separated
         # stream of files it has changed; here we react to those
         # changes by uploading back to the remote using `rclone
         # copyto`
         echo "Launching workstealer processor due to change directory=$directory action=$action file=$file"
         "$SCRIPTDIR"/workstealer | while read file
         do
             remotefile=s3:$(echo $file | sed -E "s#^$LOCAL_QUEUE_ROOT/##")
             echo "Uploading changed file: $file -> $remotefile"
             rclone --config $config copyto --retries 20 $file $remotefile
         done
     done
) &

# Poll for changes to the remote, using `rclone sync` to copy them
# locally. Then, the above inotifywait will be ... notified and then
# react to those changes.
while true
do
    rclone --config $config sync --update --exclude '*.partial' $remote $QUEUE
    sleep ${QUEUE_POLL_INTERVAL_SECONDS:-3}
done
