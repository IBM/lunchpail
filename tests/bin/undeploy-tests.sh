#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../../

# retry once after failure; this may help to cope with `etcdserver:
# request timed out` errors
echo "$(tput setaf 2)Uninstalling test Runs for $1$(tput sgr0)"

# Undeploy prior test installations. Here we sort by last modified
# time `ls -t`, so that we undeploy the most recently modified
# shrinkwraps first
if [[ -d "$TOP"/builds/test ]]
then
    if [[ -n "$1" ]] && [[ -f "$TOP"/builds/test/"$1"/test ]]
    then "$TOP"/builds/test/"$1"/test down -v
    else
        for dir in $(ls -t "$TOP"/builds/test)
        do "$TOP"/builds/test/"$dir"/test down -v &
        done

        wait
    fi
fi

echo "$(tput setaf 2)Done uninstalling test Runs for $1$(tput sgr0)"
