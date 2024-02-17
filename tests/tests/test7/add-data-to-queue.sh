#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

# number of iterations, where we add N tasks per iteration
N=${2-10}

# number of tasks to add per iteration
M=${1-3}

# name of s3 bucket in which to store the tasks
BUCKET=${3-test7}
RUN_NAME=$BUCKET

# random sleep lower and upper bounds
MINWAIT=${4-1}
MAXWAIT=${5-5}

B=$(mktemp -d)/$BUCKET # bucket path
D=$B/$RUN_NAME # data folder within that bucket
mkdir -p "$D/inbox"
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

        echo "this is task idx=$idx" > $D/inbox/task.$id.txt
        idx=$((idx+1))
    done

    "$SCRIPTDIR"/../../../hack/add-data.sh $B
    sleep $((MINWAIT+RANDOM % (MAXWAIT-MINWAIT)))
done
