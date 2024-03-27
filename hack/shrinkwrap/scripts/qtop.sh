#!/bin/sh

#
# qstat: stream statistics on queue depth and live workers
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

nLines=0

"$SCRIPTDIR"/qstat -u $@ |
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

             echo "$line"
        else
            # remove timestamp from all but the first line
            sed -E 's/[[:digit:]]+$//' <<< "$line"
        fi

        nLines=$((nLines+1))
    done
