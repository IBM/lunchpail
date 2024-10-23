#!/usr/bin/env bash

set -eo pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

lp=/tmp/lunchpail
"$TOP"/hack/setup/cli.sh $lp

IN1=$(mktemp)
echo "1" > $IN1
trap "rm -f $IN1 $add1b" EXIT

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
    local b=$(basename "$1")
    local ext=${b##*.}
    local bb=${b%%.*}
    local f="$bb".output.$ext

    if [[ -f "$(dirname "$1")/$f" ]]
    then echo "$(dirname "$1")/$f"
    else echo ./"$f"
    fi
}

function add {
    local F=$(mktemp)
    local N=$1
    echo -n $((N+$(cat $2))) > $F
    echo $F
}

function start {
    echo
    echo "🧪 $(tput setaf 5)Starting Pipeline Test: $(tput bold)$1$(tput sgr0)"
    echo -n "$(tput dim)"
}

function noLoitering {
    local which="$1"
    if [[ -n "$CI" ]]
    then if [[ 0 = $(ps | grep "$which" | grep -v grep | wc -l | xargs) ]]
         then echo "✅ PASS no loitering '$which'"
         else echo "❌ FAIL loitering '$which' process" && return 1
         fi
    fi
}

function validate {
    echo -n "$(tput sgr0)"
    local actual_ec=$1
    local expected="$2"
    local actual=$(actual "$3")
    local expected_ec=${4:-0}

    echo "🧪 $(tput setaf 5)Expected: $expected$(tput sgr0)"
    echo "🧪 $(tput setaf 5)Actual: $actual$(tput sgr0)"
    echo "🧪 $(tput setaf 5)Expected exit code: $expected_ec$(tput sgr0)"
    
    if [[ $actual_ec = $expected_ec ]]
    then echo "✅ PASS the exit code matches actual_ec=$actual_ec expected_ec=$expected_ec"
    else echo "❌ FAIL mismatched exit code actual_ec=$actual_ec expected_ec=$expected_ec" && return 1
    fi

    # validate no loitering processes remain
    noLoitering 'minio server'
    noLoitering 'worker run'

    if [[ $expected_ec != 0 ]]
    then return 1
    fi

    if [[ -e "$actual" ]]
    then echo "✅ PASS the output file exists"
    else echo "❌ FAIL missing output file" && return 1
    fi
    
    actual_sha256=$(cat "$actual" | sha256sum)
    expected_sha256=$(cat "$expected" | sha256sum)
    if [[ "$actual_sha256" = "$expected_sha256" ]]
    then echo "✅ PASS the output file is valid file=$actual"
    else echo "❌ FAIL mismatched sha256 on output file file=$actual actual_sha256=$actual_sha256 expected_sha256=$expected_sha256" && return 1
    fi

    rm -f "$actual"
}

# build an add1 using `build -e/--eval`
add1b=$(mktemp)
/tmp/lunchpail build -e 'printf "%d" $((1+$(cat $1))) > $2' -o $add1b

lpcat="$lp cat $VERBOSE"
lpadd1="$lp add1 $VERBOSE"
lpadd1b="$add1b up $VERBOSE"

start "cat"
$lpcat $IN1
validate $? "$IN1" "$IN1" # input should equal output

start "cat expecting error"
set +e
$lpcat nopenopenopenopenope
validate $? n/a n/a 1
set -e

start "cat | cat"
$lpcat $IN1 | $lpcat
validate $? "$IN1" "$IN1" # input should equal output

start "cat | cat | cat"
$lpcat $IN1 | $lpcat | $lpcat
validate $? "$IN1" "$IN1" # input should equal output

start "cat | cat | cat | cat"
$lpcat $IN1 | $lpcat | $lpcat | $lpcat
validate $? "$IN1" "$IN1" # input should equal output

# add1
start "add1"
$lpadd1 $IN1
validate $? $(add 1 "$IN1") "$IN1"

start "add1b"
$lpadd1b $IN1
validate $? $(add 1 "$IN1") "$IN1"

start "add1 | add1"
$lpadd1 $IN1 | $lpadd1
validate $? $(add 2 "$IN1") "$IN1"

start "add1b | add1b"
$lpadd1b $IN1 | $lpadd1b
validate $? $(add 2 "$IN1") "$IN1"

start "add1 | add1 | add1 | add1 | add1 | add1 | add1 | add1 | add1 | add1"
$lpadd1 $IN1 | $lpadd1 | $lpadd1 | $lpadd1 | $lpadd1 | $lpadd1 | $lpadd1 | $lpadd1 | $lpadd1 | $lpadd1
validate $? $(add 10 "$IN1") "$IN1"

start "add1b | add1b | add1b | add1b | add1b | add1b | add1b | add1b | add1b | add1b"
$lpadd1b $IN1 | $lpadd1b | $lpadd1b | $lpadd1b | $lpadd1b | $lpadd1b | $lpadd1b | $lpadd1b | $lpadd1b | $lpadd1b
validate $? $(add 10 "$IN1") "$IN1"

echo
echo "✅ PASS all pipeline tests have passed!"
