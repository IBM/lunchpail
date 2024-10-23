#!/usr/bin/env bash

set -eo pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

lp=/tmp/lunchpail
"$TOP"/hack/setup/cli.sh $lp

IN1=$(mktemp)
echo "hello world" > $IN1
trap "rm -f $IN1" EXIT

export LUNCHPAIL_NAME="pipeline-test"
export LUNCHPAIL_TARGET=${LUNCHPAIL_TARGET:-local}

if [[ "$LUNCHPAIL_TARGET" != "local" ]]
then
    echo "Skipping pipelines test for target=$LUNCHPAIL_TARGET"
    exit
fi

if [[ -n "$CI" ]]
then VERBOSE="--verbose"
fi

function actual {
    b=$(basename "$1")
    ext=${b##*.}
    bb=${b%%.*}

    dir="${2-$(dirname "$1")}"
    echo "$dir"/"$bb".output.$ext
}

function start {
    echo
    echo "🧪 $(tput setaf 5)Starting Pipeline Test: $(tput bold)$1$(tput sgr0)"
    echo -n "$(tput dim)"
}

function validate {
    echo -n "$(tput sgr0)"
    actual_ec=$1
    expected="$2"
    actual="$3"
    expected_ec=${4:-0}

    echo "🧪 $(tput setaf 5)Expected: $expected$(tput sgr0)"
    echo "🧪 $(tput setaf 5)Actual: $actual$(tput sgr0)"
    echo "🧪 $(tput setaf 5)Expected exit code: $expected_ec$(tput sgr0)"
    
    if [[ $actual_ec = $expected_ec ]]
    then echo "✅ PASS the exit code matches actual_ec=$actual_ec expected_ec=$expected_ec test=$1"
    else echo "❌ FAIL mismatched exit code actual_ec=$actual_ec expected_ec=$expected_ec test=$1" && return 1
    fi

    if [[ $expected_ec != 0 ]]
    then return
    fi

    if [[ -e "$actual" ]]
    then echo "✅ PASS the output file exists test=$1"
    else echo "❌ FAIL missing output file test=$1" && exit 1
    fi
    
    actual_sha256=$(cat "$actual" | sha256sum)
    expected_sha256=$(cat "$expected" | sha256sum)
    if [[ "$actual_sha256" = "$expected_sha256" ]]
    then echo "✅ PASS the output file is valid file=$actual test=$1"
    else echo "❌ FAIL mismatched sha256 on output file file=$actual actual_sha256=$actual_sha256 expected_sha256=$expected_sha256 test=$1" && exit 1
    fi
}

lpcat="$lp cat $VERBOSE"

start "cat"
$lpcat $IN1
validate $? "$IN1" $(actual "$IN1") # input should equal output

start "cat expecting error"
set +e
$lpcat nopenopenopenopenope
validate $? n/a n/a 1
set -e

start "cat | cat"
$lpcat $IN1 | $lpcat
validate $? "$IN1" $(actual "$IN1" .)

start "cat | cat | cat"
$lpcat $IN1 | $lpcat | $lpcat # cat | cat | cat
validate $? "$IN1" $(actual "$IN1" .)

start "cat | cat | cat | cat"
$lpcat $IN1 | $lpcat | $lpcat | $lpcat # cat | cat | cat | cat
validate $? "$IN1" $(actual "$IN1" .)

echo
echo "✅ PASS all pipeline tests have passed!"
