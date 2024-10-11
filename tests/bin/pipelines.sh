#!/usr/bin/env bash

set -eo pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

"$TOP"/hack/setup/cli.sh /tmp/lunchpail

IN1=$(mktemp)
IN2=$(mktemp)
IN3=$(mktemp)

trap "rm -f $IN1 $IN2 $IN3" EXIT

if [[ "${LUNCHPAIL_TARGET:-local}" != "local" ]]
then
    echo "Skipping pipelines test for target=$LUNCHPAIL_TARGET"
    exit
fi

export LUNCHPAIL_NAME="pipeline-test"

function tester {
    input="$2"
    cmdline="$1 $2 -t ${LUNCHPAIL_TARGET:-local}"

    $1 $2 -t ${LUNCHPAIL_TARGET:-local}
    b=$(basename "$input")
    ext=${b##*.}
    bb=${b%%.*}
    actual=$(dirname "$input")/"$bb".output.$ext
    expected="$input"
    actual_sha256=$(cat "$actual" | sha256sum)
    expected_sha256=$(cat "$expected" | sha256sum)
    if [[ "$actual_sha256" = "$expected_sha256" ]]
    then echo "✅ PASS the output file is valid file=$actual test=$TEST_NAME"
    else echo "❌ FAIL mismatched sha256 on output file file=$actual actual_sha256=$actual_sha256 expected_sha256=$expected_sha256 test=$1" && exit 1
    fi
}

tester "/tmp/lunchpail cat" $IN1
