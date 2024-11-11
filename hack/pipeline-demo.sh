#!/usr/bin/env bash

set -eo pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

lp=./lunchpail
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
then ./lunchpail build --create-namespace -e 'echo "hi from step $LUNCHPAIL_STEP"; sleep 2' -o $stepo
fi

step="$stepo up --verbose=${VERBOSE:-false} --workers 3 --queue rclone://cfp/lunchpail"

echo "Launching pipeline"
$step <(echo in1) <(echo in2) <(echo in3) <(echo in4) <(echo in5) <(echo in6) <(echo in7) <(echo in8) <(echo in9) <(echo in10) <(echo in11) <(echo in12) <(echo in13) <(echo in14) <(echo in15) <(echo in16) \
    | $step | $step | $step | $step | $step | $step | $step
