#!/usr/bin/env bash

set -eo pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

lp=/tmp/lunchpail
if [ ! -e $lp ]
then "$TOP"/hack/setup/cli.sh $lp
fi

IN1=$(mktemp)
echo "1" > $IN1
trap "rm -f $IN1 $fail $add1b $add1c $add1d" EXIT

export LUNCHPAIL_NAME="pipeline-demo"
export LUNCHPAIL_TARGET=${LUNCHPAIL_TARGET:-local}

stepo=./pipeline-demo
if [ ! -e $stepo ]
then $lp build --create-namespace -e 'echo "hi from step $LUNCHPAIL_STEP"; sleep 2' -o $stepo
fi

export RCLONE_CONFIG=$(mktemp)
QUEUE_BUCKET=pipeline-demo
MINIO_DATA_DIR=./data-$(date +%s)

PATH=$($lp needs minio):$PATH

export MINIO_ROOT_USER=lunchpail
export MINIO_ROOT_PASSWORD=lunchpail

MINIO_PORT=57331
minio server --address :$MINIO_PORT $MINIO_DATA_DIR &
MINIO_PID=$!
trap "kill $MINIO_PID; rm -f $RCLONE_CONFIG; rm -rf $MINIO_DATA_DIR" EXIT

if [[ $(uname) = Darwin ]]
then HOST_IP=host.docker.internal
else
    HOST_IP=172.17.0.1
    cat <<EOF > /tmp/kindhack.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
networking:
  apiServerAddress: "0.0.0.0"
EOF
fi

cat <<EOF > $RCLONE_CONFIG
[lunchpail]
type = s3
provider = Other
env_auth = false
endpoint = http://localhost:$MINIO_PORT
access_key_id = $MINIO_ROOT_USER
secret_access_key = $MINIO_ROOT_PASSWORD
acl = public-read

[lunchpailk]
type = s3
provider = Other
env_auth = false
endpoint = http://$HOST_IP:$MINIO_PORT
access_key_id = $MINIO_ROOT_USER
secret_access_key = $MINIO_ROOT_PASSWORD
acl = public-read
EOF

if [[ -n "$CI" ]]
then VERBOSE=true
fi

step="$stepo up --verbose=${VERBOSE:-false} --workers 3"

# local
stepl="$step -t local --queue rclone://lunchpail/$QUEUE_BUCKET"

# kubernetes?
if [[ "$LUNCHPAIL_TARGET" = "kubernetes" ]]
then stepk="$step -t kubernetes --queue rclone://lunchpailk/$QUEUE_BUCKET"
else stepk="$stepl" # if we are not intentionally testing kubernetes, then use local here, too
fi

echo "Launching pipeline"
$stepl <(echo in1) <(echo in2) <(echo in3) <(echo in4) <(echo in5) <(echo in6) <(echo in7) <(echo in8) <(echo in9) <(echo in10) <(echo in11) <(echo in12) <(echo in13) <(echo in14) <(echo in15) <(echo in16) \
    | $stepk | $stepl | $stepk | $stepl | $stepl | $stepl | $stepl
