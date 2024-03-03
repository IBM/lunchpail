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

                pod=$($KUBECTL get pod -l app.kubernetes.io/component=s3 -n $NAMESPACE_SYSTEM --no-headers -o custom-columns=NAME:.metadata.name)

                $KUBECTL cp $object_path $pod:/tmp/$object -n $NAMESPACE_SYSTEM
                $KUBECTL exec $pod -n $NAMESPACE_SYSTEM -- sh -c "until mc ls s3 > /dev/null; do echo 'Waiting for minio to come alive'; sleep 1; done; mc mb --ignore-existing s3/$bucket; mc cp --preserve --recursive /tmp/$object s3/$bucket && rm -rf /tmp/$object"
            fi
        done
    fi
done
