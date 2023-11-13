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

        # keep track of how many we have yet to assign
        nUnassigned=$nFiles

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

                    if [[ -e "$file.$RUN_ID" ]]
                    then nUnassigned=$((nUnassigned-1))
                    elif [[ -d "$queue" ]] && [[ -n "$file" ]] && [[ -f "$inbox/$file" ]]
                    then
                        echo "Moving task=$file to queue=$queue"
                        touch "$file.$RUN_ID"
                        nUnassigned=$((nUnassigned-1))
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

        report_size $nUnassigned
    fi

    sleep 5
done
