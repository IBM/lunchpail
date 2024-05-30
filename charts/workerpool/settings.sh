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

# use pod name suffix hash from batch.v1/Job controller
suffix=$(sed -E 's/^.+-([^-]+)$/\1/' <<< $POD_NAME)

config=/tmp/rclone.conf
remote=s3:/${!TASKQUEUE_VAR}/$LUNCHPAIL/$RUN_NAME/queues/$POOL.$suffix
local=$WORKQUEUE
inbox=inbox
alive=$remote/$inbox/.alive
dead=$remote/$inbox/.dead

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
