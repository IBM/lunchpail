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

function tester {
    cmdline="$1"
    expected="$2"
    actual="$3"
    expected_ec=${4:-0}

    echo ""
    echo "------------------------------------------------------------------------------------"
    echo "  $(tput bold)Test:$(tput sgr0) $1"
    echo "  $(tput bold)Expected:$(tput sgr0) $expected"
    echo "  $(tput bold)Actual:$(tput sgr0) $actual"
    echo "  $(tput bold)Expected exit code$(tput sgr0): $expected_ec"
    echo "------------------------------------------------------------------------------------"
    
    set +e
    eval "$1 $input"
    actual_ec=$?
    set -e
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
lpcatfinal="LUNCHPAIL_FORCE_TTY=1 $lp cat $VERBOSE"

tester "$lpcatfinal $IN1" "$IN1" $(actual "$IN1") # input should equal output
tester "$lpcatfinal nopenopenopenopenope" n/a n/a 1 # expect failure trying to cat a non-existent file

tester "$lpcat $IN1 | $lpcatfinal" "$IN1" $(actual "$IN1" .) # cat | cat: input should still equal output
tester "$lpcat $IN1 | $lpcat | $lpcatfinal" "$IN1" $(actual "$IN1" .) # cat | cat | cat: input should still equal output
tester "$lpcat $IN1 | $lpcat | $lpcat | $lpcatfinal" "$IN1" $(actual "$IN1" .) # cat | cat | cat | cat: input should still equal output


echo "✅ PASS all pipeline tests have passed!"
