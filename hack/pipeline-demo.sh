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

step="$stepo up --verbose=${VERBOSE:-false}"

echo "Launching pipeline"
$step <(echo 1) <(echo 2) <(echo 3) <(echo 4) <(echo 5) <(echo 6) <(echo 7) <(echo 8) <(echo 9) <(echo 10) \
    | $step | $step | $step | $step | $step | $step | $step
