#!/usr/bin/env bash

#
# Adds the directories on the command line ($@) to the platform-local
# S3. This can help with testing.
#

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

# app.kubernetes.io/component label of pod that houses local s3
S3C=workstealer

for bucket_path in $@; do
    if [[ -d $bucket_path ]]; then
        bucket=$(basename $bucket_path)
        echo "$(tput setaf 2)Populating s3 bucket $bucket from $bucket_path$(tput sgr0)"

        pod=$(kubectl get pod -l app.kubernetes.io/component=$S3C -n $NAMESPACE --no-headers -o custom-columns=NAME:.metadata.name)

        set -x
        kubectl cp $bucket_path $pod:/tmp/$bucket -n $NAMESPACE
        kubectl exec $pod -n $NAMESPACE -- sh -c "rclone copy /tmp/$bucket s3:/$bucket && rm -rf /tmp/$bucket"
        set +x
    fi
done
