#!/usr/bin/env bash

#
# run.sh <filepath>: run one test as specified by the given filepath
# to a test directory. This directory is expected to have at least a
# `settings.sh`.
#

set -e
set -o pipefail
set -o allexport

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

if [[ -z "$1" ]]
then
    echo "Usage: run.sh <testname>" 1>&2
    exit 1
elif [[ ! -f "$1"/settings.sh ]]
then
    echo "Provided test path does not contain a settings.sh" 1>&2
    exit 1
fi

# Skip disabled tests
if [[ -e "$1"/.disabled ]]
then
    echo "$(tput setaf 3)🧪 Skipping disabled test $(basename $1)$(tput sgr0)"
    exit
fi

. "$SCRIPTDIR"/helpers.sh

unset api
unset app
unset branch
unset taskqueue
unset handler
unset namespace
unset testname
unset deployname
expected=()

. "$1"/settings.sh

testname="${testname-$(basename $1)}"
echo "$(tput setaf 2)🧪 Commencing test $testname$(tput sgr0)"

#
# If the settings.sh hasn't defined the path to the app, we
# default to looking in tests/tests/<testname>/pail.
#
if [[ -z "$app" ]]
then app="$SCRIPTDIR"/../tests/$testname/pail
fi

#
# Copy in data to S3, if given a `data.sh`
#
if [[ -e "$1"/data.sh ]]; then
    echo "$(tput setaf 2)🧪 Copying in data for $testname$(tput sgr0)" 1>&2
    echo ""
    "$1"/data.sh
    "$SCRIPTDIR"/s3-copyin.sh
    echo "✅ Done copying in data for $testname"
fi

#
# Run and validate output
#
if [[ ${#expected[@]} != 0 ]]
then
    # Undeploy any prior test runs in progress
    undeploy $testname $deployname

    if [[ -e "$1"/preinit.sh ]]; then
        TEST_NAME=$testname "$1"/preinit.sh
    fi

    if [[ -n "$expectCompilationFailure" ]]
    then
        set +e
        out=$(deploy $testname $app $branch $deployname 2>&1)
        if [[ $? = 0 ]]
        then echo "Expected compilation failure, but compilation succeeded" 1>&2 && exit 1
        else
            echo "Got expected compilation failure"
            for e in "${expected[@]}"; do
                if [[ ! "$out" =~ $e ]]
                then echo "Missing expected compilation failure output from out=$out" && exit 1
                fi
            done
            echo "Got all expected compilation failure outputs"
            exit 0
        fi
    else
        deploy $testname $app $branch $deployname
    fi

    # if [[ $(basename $1) = test7d ]]
    # then kubectl logs deploy/run-controller -n $(basename $1) -f &
    # fi

    if [[ -e "$1"/init.sh ]]; then
        TEST_NAME=$testname "$1"/init.sh
    fi

    namespace=${deployname-$testname}

    ${handler-waitForIt} ${deployname:-$testname} ${namespace} $api "${expected[@]}"
    EC=$?
    undeploy $testname $deployname

    if [[ $EC != 0 ]]
    then exit $EC
    fi
fi
