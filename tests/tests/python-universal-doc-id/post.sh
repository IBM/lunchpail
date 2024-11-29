#!/usr/bin/env bash

DATA="$TEST_PATH"/pail/test-data

function validate {
    actual="$1"
    expected="$2"

    while true
    do
        if [ -f $actual ]
        then echo "✅ PASS found local task output file=$actual test=$TEST_NAME" && break
        else echo "Still waiting for local task output file=$actual test=$TEST_NAME" && sleep 1
        fi
    done

#    actual_sha256=$(cat "$actual" | sha256sum)
#    expected_sha256=$(gunzip -c "$expected" | sha256sum)
#
#    if [ "$actual_sha256" = "$expected_sha256" ]
#    then echo "✅ PASS the output file is valid file=$actual test=$TEST_NAME"
#    else echo "❌ FAIL mismatched sha256 on output file file=$actual actual_sha256=$actual_sha256 expected_sha256=$expected_sha256 test=$TEST_NAME" && exit 1
#    fi

    rm -f "$actual"
}

validate sample1.parquet "$DATA"/expected/sample1.parquet.gz
