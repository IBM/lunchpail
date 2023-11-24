#!/usr/bin/env sh

# avoid "File not found" for the $queues/* glob below
#shopt -s nullglob

inbox="$QUEUE"/"$INBOX"
queues="$QUEUE"/queues

function report_size {
    echo "codeflare.dev unassigned $1"
}

while true
do
    if [[ -d "$inbox" ]]; then
        echo "[workstealer] Scanning inbox: $inbox"

        # current unassigned work items
        files=$(ls "$inbox" | grep -v queues)
        nFiles=$(echo "$files" | wc -l)

        # keep track of how many we have yet to assign
        nUnassigned=$nFiles

        # no -n here, since we readline
        echo "$files" |
            while read file
            do
                # pick a queue randomly
                worker=$( find $queues -path "$queues/*" -maxdepth 1 -type d -print0 | shuf -z -n 1 )

                if [[ -z "$worker" ]]
                then
                    echo "[workstealer] Warning: no queues ready"
                    break
                else
                    queue=$worker/inbox

                    if [[ -e "$file.$RUN_ID" ]]
                    then nUnassigned=$((nUnassigned-1))
                    elif [[ -d "$queue" ]] && [[ -n "$file" ]] && [[ -f "$inbox/$file" ]]
                    then
                        echo "[workstealer] Moving task=$file to queue=$queue"
                        touch "$file.$RUN_ID"
                        nUnassigned=$((nUnassigned-1))
                        cp "$inbox/$file" "$queue"

                        report_size $nUnassigned
                    else
                        if [[ ! -d "$queue" ]]; then echo "[workstealer] Warning: Not a directory=$queue"; fi
                        if [[ ! -n "$file" ]]; then echo "[workstealer] Warning: Empty"; fi
                        if [[ ! -f "$inbox/$file" ]]; then echo "[workstealer] Warning: Not a file task=$inbox/$file"; fi
                        if [[ -e "$file.$RUN_ID" ]]; then echo "[workstealer] Warning: Already owned $file.$RUN_ID"; fi
                    fi
                fi
            done

        report_size $nUnassigned
    fi

    sleep 5
done
