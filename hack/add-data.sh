#!/usr/bin/env bash

#
# Adds the directories on the command line ($@) to the platform-local
# S3. This can help with testing.
#

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

for bucket_path in $@; do
    if [[ -d $bucket_path ]]; then
        bucket=$(basename $bucket_path)
        echo "$(tput setaf 2)Populating s3 bucket $bucket from $bucket_path$(tput sgr0)"
        for object_path in $bucket_path/*; do
            if [[ -f $object_path ]] || [[ -d $object_path ]]; then
                object=$(basename $object_path)
                echo "$(tput setaf 2)Adding s3 object $object to bucket $(basename $bucket)$(tput sgr0)"
                $KUBECTL cp $object_path codeflare-s3-client:/tmp/$object -n codeflare-system
                $KUBECTL exec codeflare-s3-client -n codeflare-system -- sh -c "until mc ls s3 > /dev/null; do echo 'Waiting for minio to come alive'; sleep 1; done; mc mb --ignore-existing s3/$bucket; mc cp --preserve --recursive /tmp/$object s3/$bucket && rm -rf /tmp/$object"
            fi
        done
    fi
done
