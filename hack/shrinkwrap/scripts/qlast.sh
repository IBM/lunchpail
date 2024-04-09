#!/bin/sh

#
# qlast <field> [column=2]: print the rows of qstat for the given row
# field, but only for the last iteration of qstat output. By default,
# column 2 of the rows will be projected out.
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

ARGS="$@"
while getopts "ot:" opt; do true; done
shift $((OPTIND-1))

ROW_FIELD=$1

# the sed removes ANSI colorization
"$SCRIPTDIR"/qstat -o -t 1000 $ARGS |
    (
        while read line
        do
            marker=$(echo "$line" | awk '{print $1}')

            if [ "$marker" = "unassigned" ]
            then last=""
            fi

            if [ "$marker" = "$ROW_FIELD" ]
            then
                if [ -z "$last" ]
                then last="$line"
                else last="$last\n$line"
                fi
            fi
        done

        printf "$last"
    ) | sed -e 's/\x1b\[[0-9;]*m//g' | awk -v columnfield=${2:-2} '{print $columnfield}'
