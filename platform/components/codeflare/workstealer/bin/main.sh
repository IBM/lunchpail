#!/usr/bin/env sh

inbox="$QUEUE"/"$INBOX"
queues="$QUEUE"/queues

function report_size {
    echo "codeflare.dev unassigned $1"
}

while true
do
    if [[ -d "$inbox" ]]; then
        echo "Scanning inbox: $inbox"

        # current unassigned work items
        files=$(ls "$inbox" | grep -v queues)
        nFiles=$(echo "$files" | wc -l)
        report_size $nFiles

        echo "Task $files"

        # no -n here, since we readline
        echo "$files" |
            while read file
            do
                # pick a queue randomly
                worker=$( find $queues/* -maxdepth 0 -type d -print0 | shuf -z -n 1 )

                if [[ -z "$worker" ]]
                then echo "Warning: queue not ready"
                else
                    queue=$worker/inbox
                    echo "Selected queue=$queue task=$file"

                    if [[ -d "$queue" ]] && [[ -n "$file" ]] && [[ -f "$inbox/$file" ]] && [[ ! -e "$file.$RUN_ID" ]]
                    then
                        echo "Moving task=$file to queue=$queue"
                        touch "$file.$RUN_ID"
                        cp "$inbox/$file" "$queue"

                        if [[ $? = 0 ]]; then
                            nFiles=$((nFiles - 1))
                            report_size $nFiles
                        fi
                    else
                        if [[ ! -d "$queue" ]]; then echo "Warning: Not a directory=$queue"; fi
                        if [[ ! -n "$file" ]]; then echo "Warning: Empty"; fi
                        if [[ ! -f "$inbox/$file" ]]; then echo "Warning: Not a file task=$inbox/$file"; fi
                        if [[ -e "$file.$RUN_ID" ]]; then echo "Warning: Already owned $file.$RUN_ID"; fi
                    fi
                fi
            done
    fi

    sleep 5
done
