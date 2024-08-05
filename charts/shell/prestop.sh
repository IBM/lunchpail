#!/usr/bin/env bash

echo "DEBUG prestop starting"

config=/tmp/rclone-prestop.conf
donefile=s3:/$LUNCHPAIL_QUEUE_PATH/done

cat <<EOF > $config
[s3]
type = s3
provider = Other
env_auth = false
endpoint = $lunchpail_queue_endpoint
access_key_id = $lunchpail_queue_accessKeyID
secret_access_key = $lunchpail_queue_secretAccessKey
acl = public-read
EOF

echo "DEBUG prestop touching donefile"
rclone --config $config touch $donefile
echo "DEBUG prestop touching donefile: done"

echo "INFO Done with my part of the job"
