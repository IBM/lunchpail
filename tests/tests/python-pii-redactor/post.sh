#!/bin/sh

DATA="$TEST_PATH"/pail/test-data

actual="$DATA"/xs/1.output.parquet
expected="$DATA"/xs/1.expected.parquet.gz

if [ -f $actual ]
then echo "✅ PASS found local task output file=$actual test=$TEST_NAME" && rm -f $actual
else echo "❌ FAIL cannot find local task output file=$actual test=$TEST_NAME" && exit 1
fi

actual_sha256=$(cat "$actual" | sha256)
expected_sha256=$(gzcat "$expected" | sha256 )

if [ "$actual_sha256" = "$expected_sha256" ]
then echo "✅ PASS found local task output file=$f test=$TEST_NAME" && rm -f $f
else echo "❌ FAIL cannot find local task output file=$f test=$TEST_NAME" && exit 1
fi
