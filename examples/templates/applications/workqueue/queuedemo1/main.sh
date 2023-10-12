#!/usr/bin/env sh

# $1 filepath
# $2 processing folder
# $4 outbox folder
in="$1"
processing="$2"
out="$3"

echo "Processing $in"
mv $in $processing

sleep 5

echo "Done with $processing"
mv $processing $out

