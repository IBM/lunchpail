#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

export NAMESPACE=$1

# number of iterations, where we add N tasks per iteration
N=${3-10}

# number of tasks to add per iteration
M=${2-3}

# name of s3 bucket in which to store the tasks
BUCKET=${4-test7}
RUN_NAME=$BUCKET

B=$(mktemp -d)/$BUCKET # bucket path
D=$B/$BUCKET # data path; in this case the bucket name and the folder name are both the run name
mkdir -p $D
echo "Staging to $D" 1>&2

idx=1
for i in $(seq 1 $N) # for each iteration
do

    for i in $(seq 1 $M) # for each task
    do
        # if we are doing a test, then make sure to use a
        # repeatable name for the task files, so that we know what
        # to look for when confirming that the tasks were
        # processed by the workers
        if [[ -n "$CI" ]] || [[ -n "$RUNNING_CODEFLARE_TESTS" ]]; then
            id=$idx
        else
            # otherwise, use a more random name, so that we can
            # inject multiple batches of tasks across executions
            # of this script
            id=$(uuidgen)
        fi

        echo "this is task idx=$idx" > $D/task.$id.txt
        idx=$((idx+1))
    done

    "$SCRIPTDIR"/../../../tests/bin/add-data.sh $B
done
