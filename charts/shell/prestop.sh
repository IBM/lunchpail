#!/usr/bin/env bash

echo "[Lunchpail] prestop starting"

config=/tmp/rclone-prestop.conf
donefile=s3:/${!TASKQUEUE_VAR}/$LUNCHPAIL/$RUN_NAME/done

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

echo "[Lunchpail] prestop touching donefile"
rclone --config $config touch $donefile
echo "[Lunchpail] prestop touching donefile: done"
