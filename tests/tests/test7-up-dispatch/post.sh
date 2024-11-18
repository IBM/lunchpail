#!/bin/sh

for i in $(seq 1 6)
do
    f="task.$i.txt"
    if [ -f $f ]
    then echo "✅ PASS found local task output file=$f test=$TEST_NAME" && rm -f $f
    else echo "❌ FAIL cannot find local task output file=$f test=$TEST_NAME" && exit 1
    fi
done

