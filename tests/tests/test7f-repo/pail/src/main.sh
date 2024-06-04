#!/usr/bin/env sh

# $1 input filepath
# $2 output filepath
in="$1"
out="$2"

echo "Processing $in"
t=${WORK_TIME-5}
duration=$(shuf -n 1 -i $((t-3))-$((t+3)))
sleep $duration

echo "Done with $in"
