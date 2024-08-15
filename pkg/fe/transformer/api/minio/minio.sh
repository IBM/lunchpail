#!/bin/sh

echo "Starting minio"

export MINIO_ROOT_USER=$lunchpail_queue_accessKeyID
export MINIO_ROOT_PASSWORD=$lunchpail_queue_secretAccessKey

printenv
minio server ./data &

# we need to specify --api otherwise mc will probe the given
# endpoint to auto-detect the api version... but we know the
# server isn't ready yet. s3v4 is just the stable api version
# (there were only ever two stable s3 api versions)
mc config host add lunchpail http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD --api s3v4

while ! mc ready lunchpail; do sleep 1; done
echo "Server is ready, now waiting for the all done marker"

mc mb lunchpail/$LUNCHPAIL_QUEUE_BUCKET

# We want to exit when mc watch emits a single line. This is the
# bash magic to do so. Note the `head -1` -- one single
# line. This works because `head` SIGPIPE-kills the pipeline
# when it exits, but if we did the naive `mc watch | head -1`,
# head would not SIGPIPE until the *next* byte, which... will
# never appear.
# ref: https://unix.stackexchange.com/a/404277
set -x
{ head -1; kill "$!"; } < <(mc watch lunchpail/$LUNCHPAIL_QUEUE_BUCKET --prefix $LUNCHPAIL_QUEUE_PREFIX/alldone --events put)
echo "Got all done marker, exiting..."
