#!/usr/bin/env bash

DATA="$TEST_PATH"/pail/test-data

for i in "$DATA"/input/*
do
    b=$(basename $i)
    if [[ "$b" =~ ".v1." ]]
    then continue
    fi

    ext=${b##*.}
    bb=${b%%.*}
    actual="$(dirname $i)"/"$bb".v1.$ext
    expected="$DATA"/expected/$bb.parquet.gz

    while true
    do
        if [ -f $actual ]
        then echo "✅ PASS found local task output file=$actual test=$TEST_NAME" && break
        else echo "Still waiting for local task output file=$actual test=$TEST_NAME" && sleep 1
        fi
    done

    actual_sha256=$(cat "$actual" | sha256sum)
    expected_sha256=$(gunzip -c "$expected" | sha256sum)

    # ugh, we cannot currently compare the output contents due to an upstream bug
    # https://github.com/IBM/data-prep-kit/issues/483
    if [ "$actual_sha256" = "$expected_sha256" ]
    then echo "✅ PASS the output file is valid file=$actual test=$TEST_NAME"
    else echo "❌ FAIL (but ignoring for now) mismatched sha256 on output file file=$actual expected=$expected actual_sha256=$actual_sha256 expected_sha256=$expected_sha256 test=$TEST_NAME" # && exit 1
    fi

    rm -f "$actual"
done
