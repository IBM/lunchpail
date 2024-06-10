#!/usr/bin/env bash

#
# This copies into the platform-local S3 the contents of the top-level
# `data/` directory (if it exists). This can help with testing.
#

set -eo pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

if [[ -d data/s3 ]]; then
    for bucket_path in data/s3/*; do
        "$SCRIPTDIR"/add-data.sh "$bucket_path"
    done
fi
