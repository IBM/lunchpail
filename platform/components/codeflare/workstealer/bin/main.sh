#!/usr/bin/env sh

inbox="$QUEUE"/inbox
queues="$QUEUE"/queues

while true
do
    if [[ -d "$inbox" ]]; then
        echo "Scanning inbox: $inbox"

        nQueues=$(ls "$queues" | wc -l)
        idx=0

        ls "$inbox" |
            while read file
            do
                queue="$queues/$idx/inbox"
                echo "Moving task=$file to queue=$queue"
                mv "$inbox/$file" "$queue"
                idx=$((idx + 1))
                idx=$((idx % $nQueues))
            done                
    fi

    sleep 5
done
