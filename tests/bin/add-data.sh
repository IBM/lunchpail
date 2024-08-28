#!/usr/bin/env bash

#
# Adds the directories on the command line ($@) to the platform-local
# S3. This can help with testing.
#

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

# app.kubernetes.io/component label of pod that houses local s3
selector=app.kubernetes.io/component=workstealer

for bucket_path in $@; do
    if [[ -d $bucket_path ]]; then
        bucket=$(basename $bucket_path)
        echo "$(tput setaf 2)Populating s3 bucket $bucket from $bucket_path$(tput sgr0)"

        pod=$(kubectl get pod -l $selector -n $NAMESPACE --no-headers -o custom-columns=NAME:.metadata.name)

        while true
        do
            kubectl wait pod $pod -n $NAMESPACE --for=condition=Ready --timeout=5s && break
            sleep 1
        done
        
        set -x
        kubectl cp -c main $bucket_path $pod:/tmp/$bucket -n $NAMESPACE
        kubectl exec $pod -n $NAMESPACE -c main -- sh -c "lunchpail qin /tmp/$bucket $bucket && rm -rf /tmp/$bucket"
        set +x
    fi
done
