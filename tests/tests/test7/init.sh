#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

# make sure these values are compatible with the values in ./settings.sh
NUM_ITERS=1
NUM_TASKS_PER_ITER=3
NUM_WORKERS=2

"$SCRIPTDIR"/add-data-to-queue.sh \
            $NUM_ITERS \
            $NUM_TASKS_PER_ITER \
            $NUM_WORKERS \
            ${TEST_NAME-test7}
