#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

# make sure these values are compatible with the values in ./settings.sh
NUM_ITERS=2
NUM_TASKS_PER_ITER=3

# $1: namespace

"$SCRIPTDIR"/add-data-to-queue.sh \
            $1 \
            $NUM_ITERS \
            $NUM_TASKS_PER_ITER \
            ${TEST_NAME-test7}
