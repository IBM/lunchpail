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

if [[ -n "$CI" ]]
then VERBOSE="--verbose"
fi

function tester {
    input="$2"
    cmdline="$1 $2 -t ${LUNCHPAIL_TARGET:-local}"
    expected_ec=${3:-0}

    echo ""
    echo "------------------------------------------------------------------------------------"
    echo "  $(tput bold)Test:$(tput sgr0) $1"
    echo "  $(tput bold)Input:$(tput sgr0) $input"
    echo "  $(tput bold)Expected exit code$(tput sgr0): $expected_ec"
    echo "------------------------------------------------------------------------------------"
    
    set +e
    $1 $2 -t ${LUNCHPAIL_TARGET:-local} $VERBOSE
    actual_ec=$?
    set -e
    if [[ $actual_ec = $expected_ec ]]
    then echo "✅ PASS the exit code matches actual_ec=$actual_ec expected_ec=$expected_ec test=$1"
    else echo "❌ FAIL mismatched exit code actual_ec=$actual_ec expected_ec=$expected_ec test=$1" && return 1
    fi

    if [[ $expected_ec != 0 ]]
    then return
    fi

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
tester "/tmp/lunchpail cat" nopenopenopenopenope 1
