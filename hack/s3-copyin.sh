#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

if [[ -d data/s3 ]]; then
    for bucket_path in data/s3/*; do
        if [[ -d $bucket_path ]]; then
            bucket=$(basename $bucket_path)
            echo "$(tput setaf 2)Populating s3 bucket $bucket from $bucket_path$(tput sgr0)"
            for object_path in $bucket_path/*; do
                if [[ -f $object_path ]] || [[ -d $object_path ]]; then
                    object=$(basename $object_path)
                    echo "$(tput setaf 2)Adding s3 object $object to bucket $(basename $bucket)$(tput sgr0)"
                    $KUBECTL cp $object_path codeflare-s3-client:/tmp/$object -n codeflare-system
                    $KUBECTL exec codeflare-s3-client -n codeflare-system -- sh -c "until mc ls s3; do echo 'Waiting for minio to come alive'; sleep 1; done; mc mb s3/$bucket; mc cp -r /tmp/$object s3/$bucket && rm -rf /tmp/$object"
                fi
            done
        fi
    done
fi
