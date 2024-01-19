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
        files=$(ls "$inbox" | grep -v .lock | grep -v .done)
        nFiles=$(echo "$files" | wc -l)

        # keep track of how many we have yet to assign
        nUnassigned=$nFiles

        echo "[workstealer] Considering $nFiles files for assignment to a worker"
        
        # no -n here, since we readline
        for file in $files
        do
            if [[ -f "$inbox/$file.done" ]]
            then
                # the work is already flagged as done
                nUnassigned=$((nUnassigned-1))
                echo "[workstealer] skipping already-done file=$file nUnassigned=$nUnassigned"
                continue
            elif [[ -f "$inbox/$file.lock" ]]
            then
                # the file may be done? check...
                worker=$(cat "$inbox/$file.lock")
                donefile="$worker/outbox/$file.done"
                echo "[workstealer] checking for donefile $donefile"
                if [[ -f "$donefile" ]]
                then
                    # yes, it is done, flag it as such
                    nUnassigned=$((nUnassigned-1))
                    echo "[workstealer] skipping already-done (2) file=$file nUnassigned=$nUnassigned"
                    touch "$inbox/$file.done"
                    rm "$inbox/$file.lock"
                    continue
                fi
            fi
                    
            # otherwise, pick a worker randomly and send the task to that worker's queue
            worker=$( find $queues -path "$queues/*" -maxdepth 1 -type d -print0 | shuf -z -n 1 )

            if [[ -z "$worker" ]]
            then
                echo "[workstealer] Warning: no queues ready"
                break
            else
                queue="$worker/inbox"

                if [[ ! -e "$queue/.alive" ]]
                then
                    # TODO: maybe we need to loop more tightly
                    # here over possibly available workers?
                    # otherwise, we may delay 5 seconds in
                    # assigning a task, even when there are other
                    # workers that *are* active?
                    echo "[workstealer] skipping inactive queue=$queue"

                    # unlock any files owned by that worker
                    ls *.lock 2> /tmp/workstealer.err |
                        while read filelock
                        do
                            if grep $worker "$filelock"
                            then
                                donefile="$worker/outbox/${file%.*}"
                                echo "[workstealer] Checking if task is done: $donefile"
                                if [[ -f $donefile ]]
                                then
                                    echo "[workstealer] Removing finished task owned by dead worker=$worker filelock=$filelock"
                                    touch "${file%.*}.done"
                                else
                                    echo "[workstealer] Unlocking task owned by dead worker=$worker filelock=$filelock"
                                fi
                                rm "$filelock"
                            fi
                        done

                    continue
                fi

                if [[ -e "$inbox/$file.lock" ]]
                then
                    nUnassigned=$((nUnassigned-1))
                    echo "[workstealer] skipping already-locked file=$file nUnassigned=$nUnassigned"
                elif [[ -d "$queue" ]] && [[ -n "$file" ]] && [[ -f "$inbox/$file" ]]
                then
                    nUnassigned=$((nUnassigned-1))
                    echo "[workstealer] Moving task=$file to queue=$queue nUnassigned=$nUnassigned"
                    echo "$worker" > "$inbox/$file.lock"
                    cp "$inbox/$file" "$queue"
                else
                    echo "[workstealer] Warning: strange! Unable to assign task to a worker: $file"
                    if [[ ! -d "$queue" ]]; then echo "[workstealer] Warning: Not a directory=$queue"; fi
                    if [[ ! -n "$file" ]]; then echo "[workstealer] Warning: Empty"; fi
                    if [[ ! -f "$inbox/$file" ]]; then echo "[workstealer] Warning: Not a file task=$inbox/$file"; fi
                    if [[ -e "$inbox/$file.lock" ]]; then echo "[workstealer] Warning: Already owned $(cat $inbox/$file.lock)"; fi
                fi
            fi
        done

        report_size $nUnassigned
    fi

    sleep 5
done
