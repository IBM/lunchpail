#!/usr/bin/env bash

set -eo pipefail

printenv

config=/tmp/rclone.conf
remote=queue:/$LUNCHPAIL_QUEUE_PATH/inbox

echo "ProcessS3Objects dispatcher starting up. Using remote=$remote and processing bucket=$__LUNCHPAIL_PROCESS_S3_OBJECTS_PATH"

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
endpoint = $lunchpail_queue_endpoint
access_key_id = $lunchpail_queue_accessKeyID
secret_access_key = $lunchpail_queue_secretAccessKey
acl = public-read
EOF

while true
do
    set +e
    tasks=$(rclone --config $config lsf origin:$__LUNCHPAIL_PROCESS_S3_OBJECTS_PATH)
    if [[ $? != 0 ]]
    then
        echo "Retrying. S3 may not be ready?"
        sleep 1
        continue
    fi
    set -e

    for task in $tasks
    do
        for i in $(seq 1 ${__LUNCHPAIL_PROCESS_S3_OBJECTS_REPEAT:-1})
        do
            ext=${task##*.}
            remote_task="${task%.*}.$i.$ext"
            echo "Injecting task=$task as remote_task=$remote/$remote_task"
            rclone --config $config copyto origin:$__LUNCHPAIL_PROCESS_S3_OBJECTS_PATH/$task $remote/$remote_task
        done
    done

    break
done
