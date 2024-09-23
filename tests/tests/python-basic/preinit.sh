cat <<'EOF' >> $RCLONE_CONFIG
[rcloneremotetest]
type = s3
provider = Other
env_auth = false
endpoint = $TEST_QUEUE_ENDPOINT
access_key_id = $TEST_QUEUE_ACCESSKEY
secret_access_key = $TEST_QUEUE_SECRETKEY
acl = public-read
EOF
