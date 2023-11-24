#!/usr/bin/env bash

set -e
set -o pipefail

# in case there are things we want to do differently knowing that we
# are running a test (e.g. to produce more predictible output);
# e.g. see test7/init.sh
export RUNNING_CODEFLARE_TESTS=1

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

. "$SCRIPTDIR"/helpers.sh

while getopts "gu" opt
do
    case $opt in
        g) DEBUG=true; continue;;
        u) BRING_UP_CLUSTER=true; continue;;
    esac
done
shift $((OPTIND-1))

undeploy
up
watch

# test app not found
for path in "$SCRIPTDIR"/../tests/*
do
    if [[ $(basename $path) =~ "README.md" ]] || [[ -n "$1" ]] && [[ $1 != $(basename $path) ]]
    then
       continue
    fi

    unset api
    unset handler
    unset namespace
    unset testname
    expected=()

    . "$path"/settings.sh

    testname=${testname-$(basename $path)}

    if [[ -e "$path"/data.sh ]]; then
        echo "$(tput setaf 2)🧪 Copying in data for $testname$(tput sgr0)" 1>&2
        echo ""
        "$path"/data.sh
        "$TOP"/hack/s3-copyin.sh
        echo "✅ Done copying in data for $testname"
    fi
    
    if [[ ${#expected[@]} != 0 ]]
    then
        deploy $testname & D=$!

        if [[ -e "$path"/init.sh ]]; then
            TEST_NAME=$testname "$path"/init.sh
        fi
        
        ${handler-waitForIt} $testname ${namespace-codeflare-test} "${expected[@]}" $api
        undeploy $testname $D
    fi
done

echo "Test runs complete"
exit 0
