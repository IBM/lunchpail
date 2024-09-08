cat <<'EOF' >> $RCLONE_CONFIG
[rcloneremotetest]
type = s3
provider = Other
env_auth = false
endpoint = http://$TEST_RUN-minio.test7.svc.cluster.local:$TEST_PORT
access_key_id = $TEST_ACCESSKEY
secret_access_key = $TEST_SECRETKEY
acl = public-read
EOF
