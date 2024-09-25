#!/usr/bin/env bash

#
# Adds the directories on the command line ($@) to the platform-local
# S3. This can help with testing.
#

set -eo pipefail

# Wait for minio component
echo "$(tput setaf 2)Pre-Populating s3 app=$testapp target=${LUNCHPAIL_TARGET:-kubernetes} (waiting for s3 to be ready)$(tput sgr0)"
$testapp run instances \
         --namespace $NAMESPACE \
         --target ${LUNCHPAIL_TARGET:-kubernetes} \
         --component minio \
         --wait --quiet

for bucket_path in $@; do
    if [[ -d $bucket_path ]]; then
        bucket=$(basename $bucket_path)
        echo "$(tput setaf 2)Populating s3 app=$testapp target=${LUNCHPAIL_TARGET:-kubernetes} bucket=$bucket from $bucket_path$(tput sgr0)"
        $testapp queue upload $bucket_path $bucket --target ${LUNCHPAIL_TARGET:-kubernetes}
    fi
done
