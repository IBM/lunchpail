#!/usr/bin/env bash

#
# run.sh <filepath>: run one test as specified by the given filepath
# to a test directory. This directory is expected to have at least a
# `settings.sh`.
#

set -e
set -o pipefail

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

# Undeploy any prior test runs in progress
undeploy $testname

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
    "$TOP"/hack/s3-copyin.sh
    echo "✅ Done copying in data for $testname"
fi

#
# Run and validate output
#
if [[ ${#expected[@]} != 0 ]]
then
    deploy $testname $app $branch $deployname

    if [[ -e "$1"/init.sh ]]; then
        TEST_NAME=$testname "$1"/init.sh
    fi

    if [[ -f "$TOP"/builds/test/$testname/05-jaas-default-user.namespace ]]
    then namespace=$(cat "$TOP"/builds/test/$testname/05-jaas-default-user.namespace)
    fi

    ${handler-waitForIt} ${deployname:-$testname} ${namespace-$NAMESPACE_USER} $api "${expected[@]}"
    EC=$?
    undeploy $testname

    if [[ $EC != 0 ]]
    then exit $EC
    fi
fi
