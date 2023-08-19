#!/usr/bin/env sh

inbox="$QUEUE"/inbox
queues="$QUEUE"/queues

function report_size {
    echo "codeflare.dev unassigned $1"
}

while true
do
    if [[ -d "$inbox" ]]; then
        echo "Scanning inbox: $inbox"

        # current unassigned work items
        files=$(ls "$inbox")
        nFiles=$(echo -n "$files" | wc -l)
        report_size $nFiles

        # current number of consumers/workers
        nQueues=$(ls "$queues" | wc -l)
        idx=0

        # no -n here, since we readline
        echo "$files" |
            while read file
            do
                queue="$queues/$idx/inbox"

                if [[ -d "$queue" ]]
                then
                    echo "Moving task=$file to queue=$queue"
                    mv "$inbox/$file" "$queue"

                    nFiles=$((nFiles - 1))
                    report_size $nFiles

                    # we currently use round-robin assignment to workers
                    idx=$((idx + 1))
                    idx=$((idx % $nQueues))
                fi
            done                
    fi

    sleep 5
done
