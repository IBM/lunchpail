#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../../..

. "$TOP"/hack/secrets.sh

"$TOP"/tests/bin/mc.sh

ENDPOINT="https://s3.us-east.cloud-object-storage.appdomain.cloud"
MC_BUCKET_PATH=cfp/cfp-hap-xs

LOCAL_PATH="$TOP"/data/s3/defaultjaasqueue/$LUNCHPAIL/hapq/inbox

if ! which mc > /dev/null
then
    echo 'Error: minio client `mc` not found'
    exit 1
fi

if [[ -z "$COS_ACCESS_KEY" ]]
then
    echo 'Error: COS_ACCESS_KEY not defined'
    exit 1
fi

if [[ -z "$COS_SECRET_KEY" ]]
then
    echo 'Error: COS_SECRET_KEY not defined'
    exit 1
fi

mc alias set cfp $ENDPOINT $COS_ACCESS_KEY $COS_SECRET_KEY

mkdir -p "$LOCAL_PATH"

mc ls $MC_BUCKET_PATH | awk '{print $NF}' | grep '\.parquet' |
    while read file
    do
        mc cp "$MC_BUCKET_PATH/$file" "$LOCAL_PATH"
    done
