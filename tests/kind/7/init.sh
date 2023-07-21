#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

# number of iterations, where we add N tasks per iteration
N=${2-10}

# number of tasks to add per iteration
M=${1-3}

# number of workers
W=${3-2}

# name of s3 bucket in which to store the tasks
BUCKET=${4-test7}

# random sleep lower and upper bounds
MINWAIT=${5-1}
MAXWAIT=${6-5}

D=$(mktemp -d)/$BUCKET
mkdir -p "$D"
echo "Staging to $D" 1>&2

idx=1
for i in $(seq 1 $N) # for each iteration
do
    for w in $(seq 0 $((W-1))) # for each worker
    do
        rm -rf $D/$w/inbox
        mkdir -p $D/$w/inbox
    done

    for i in $(seq 1 $M) # for each task
    do
        for w in $(seq 0 $((W-1))) # for each worker
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

            echo "this is task idx=$idx initially assigned to worker $w" > $D/$w/inbox/task.$id.txt
            idx=$((idx+1))
        done
    done

    "$SCRIPTDIR"/../../../hack/add-data.sh $D
    sleep $((MINWAIT+RANDOM % (MAXWAIT-MINWAIT)))
done
