#!/usr/bin/env bash

set -eo pipefail

config=/tmp/rclone.conf
remote=queue:/${!TASKQUEUE_VAR}/$LUNCHPAIL/$RUN_NAME/inbox

cat <<EOF > $config
[origin]
type = s3
provider = Other
env_auth = false
endpoint = ${!__LUNCHPAIL_PROCESS_S3_OBJECTS_ENDPOINT_VAR}
access_key_id = ${!__LUNCHPAIL_PROCESS_S3_OBJECTS_ACCESS_KEY_VAR}
secret_access_key = ${!__LUNCHPAIL_PROCESS_S3_OBJECTS_SECRET_KEY_VAR}
acl = public-read

[queue]
type = s3
provider = Other
env_auth = false
endpoint = ${!S3_ENDPOINT_VAR}
access_key_id = ${!AWS_ACCESS_KEY_ID_VAR}
secret_access_key = ${!AWS_SECRET_ACCESS_KEY_VAR}
acl = public-read
EOF

for task in $(rclone --config $config lsf origin:$__LUNCHPAIL_PROCESS_S3_OBJECTS_PATH)
do
    for i in $(seq 1 ${__LUNCHPAIL_PROCESS_S3_OBJECTS_REPEAT:-1})
    do
        ext=${task##*.}
        remote_task="${task%.*}.$i.$ext"
        echo "Injecting task=$task as remote_task=$remote_task"
        rclone --config $config copyto origin:$__LUNCHPAIL_PROCESS_S3_OBJECTS_PATH/$task $remote/$remote_task
    done
done
