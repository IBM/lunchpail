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

    if [ ! -e "$expected" ]
    then echo "❌ FAIL cannot find expected output file $expected test=$TEST_NAME" && exit 1
    fi

    actual_sha256=$(cat "$actual" | sha256sum)
    expected_sha256=$(gunzip -c "$expected" | sha256sum)

    if [ "$actual_sha256" = "$expected_sha256" ]
    then echo "✅ PASS the output file is valid file=$actual test=$TEST_NAME"
    else echo "❌ FAIL mismatched sha256 on output file file=$actual actual_sha256=$actual_sha256 expected_sha256=$expected_sha256 test=$TEST_NAME" && exit 1
    fi

    rm -f "$actual"
}

validate test1_0.parquet "$DATA"/expected/test1_0.parquet.gz
validate test1_1.parquet "$DATA"/expected/test1_1.parquet.gz
validate test2_0.parquet "$DATA"/expected/test2_0.parquet.gz
validate test2_1.parquet "$DATA"/expected/test2_1.parquet.gz
validate test3_0.parquet "$DATA"/expected/test3_0.parquet.gz
validate test3_1.parquet "$DATA"/expected/test3_1.parquet.gz
