#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

# make sure these values are compatible with the values in ./settings.sh
NUM_TASKS=6

# $1: namespace

"$SCRIPTDIR"/add-data-to-queue.sh \
            $1 \
            $NUM_TASKS \
            ${TEST_NAME-test7}
