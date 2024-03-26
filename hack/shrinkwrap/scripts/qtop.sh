#!/bin/sh

#
# qstat: stream statistics on queue depth and live workers
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

nLines=0

"$SCRIPTDIR"/qstat $@ |
    while read -r line
    do
        if [[ $(awk '{print $2}' <<< "$line") = unassigned ]]
        then
            if [[ $nLines != 0 ]]
            then
                # clear the prior display
                tput cuu $nLines
                tput ed
                nLines=0
            fi

            echo "$line"
            nLines=$((nLines+1))
        fi
    done
