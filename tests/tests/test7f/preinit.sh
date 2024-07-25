rclone config delete rcloneremotetest
cat <<'EOF' >> ~/.config/rclone/rclone.conf 
[rcloneremotetest]
type = s3
provider = Other
env_auth = false
endpoint = http://$TEST_RUN-lunchpail-s3.test7f.svc.cluster.local:$TEST_PORT
access_key_id = $TEST_ACCESSKEY
secret_access_key = $TEST_SECRETKEY
acl = public-read
EOF
