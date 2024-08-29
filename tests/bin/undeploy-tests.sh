#!/usr/bin/env bash

set -e
set -o pipefail

#
# $1: test name
# $2: [deploy name] e.g. if we call it test8, but the git repo calls it something else; this is the something else
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../../

appname="${2-$1}"

# retry once after failure; this may help to cope with `etcdserver:
# request timed out` errors
echo "$(tput setaf 2)Uninstalling test Runs for testdir=$1 appname=$appname$(tput sgr0)"

# Undeploy prior test installations. Here we sort by last modified
# time `ls -t`, so that we undeploy the most recently modified
# shrinkwraps first
if [[ -d "$TOP"/builds/test ]]
then
    if [[ -n "$appname" ]] && [[ -f "$TOP"/builds/test/"$appname"/test ]]
    then "$TOP"/builds/test/"$appname"/test down --target=${LUNCHPAIL_TARGET:-kubernetes} -v
    else
        for dir in $(ls -t "$TOP"/builds/test)
        do
            if [ -f "$TOP"/builds/test/"$dir"/test ]
            then "$TOP"/builds/test/"$dir"/test down --target=${LUNCHPAIL_TARGET:-kubernetes} -v &
            fi
        done

        wait
    fi
fi

echo "$(tput setaf 2)Done uninstalling test Runs for $1$(tput sgr0)"
