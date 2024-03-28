#!/bin/sh

#
# qstat: stream statistics on queue depth and live workers
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

nLines=0

# clear screen
printf "\033c"

"$SCRIPTDIR"/qstat -t 1000 $@ |
    while read -r line
    do
        if [[ $(awk '{print $1}' <<< "$line") = unassigned ]]
        then if [[ $nLines != 0 ]]
             then
                 # clear the prior display
                 tput cuu $nLines
                 tput ed
                 nLines=0
             fi
        fi

        echo "$line"
        nLines=$((nLines+1))
    done
