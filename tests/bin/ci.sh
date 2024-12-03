#!/usr/bin/env bash

#
# ci.sh: run all tests subject to optional inclusion `-i` and
# exclusion `-e` filters. After ensuring that the system is ready, we
# invoke `./run.sh` to do the heavy lifting of the actual run.
#

set -eo pipefail

# In case there are things we want to do differently knowing that we
# are running a test (e.g. to produce more predictible output);
# e.g. see test7/init.sh
export RUNNING_LUNCHPAIL_TESTS=1

if [[ -n "$IC_API_KEY" ]]
then
    export TEST_IBMCLOUD=1
fi

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

. "$SCRIPTDIR"/helpers.sh

# On ctrl+c, kill the subprocesses that may have launched
trap "pkill -P $$" SIGINT SIGTERM

echo "Starting CI tests with VERBOSE=${VERBOSE:=false}"

if [[ ${LUNCHPAIL_TARGET:-kubernetes} = kubernetes ]]
then /tmp/lunchpail dev init local --build-images --verbose=${VERBOSE:=false}
fi

#
# Iterate over the tests/* directory
#
for path in "$SCRIPTDIR"/../tests/*
do
    base="$(basename $path)"

    # skip over non-tests, and any tests not $TEST_FROM_ARGV (i.e. if the user asked to run a specific test)
    if [[ $base =~ "README.md" ]]
    then
        echo "$(tput setaf 3)🧪 Skipping non-test $base$(tput sgr0)"
        continue
    fi

    if [[ -n "$TEST_FROM_ARGV" ]] && [[ $TEST_FROM_ARGV != $base ]]
    then
        echo "$(tput setaf 3)🧪 Skipping due to non-match $base$(tput sgr0)"
        continue
    fi
                                                                                    
    # skip tests without a settings.sh
    if [[ ! -e "$path"/settings.sh ]]
    then
        echo "$(tput setaf 3)🧪 Skipping due to missing settings.sh $base$(tput sgr0)"
        continue
    fi

    # skip excluded tests
    if [[ -n "$EXCLUDE" ]] && echo "$base" | grep -Eq $EXCLUDE
    then
        echo "$(tput setaf 3)🧪 Skipping excluded $base$(tput sgr0)"
        continue
    fi

    # skip not-included tests
    if [[ -n "$INCLUDE" ]] && echo "$path" | grep -Eqv $INCLUDE
    then
        echo "$(tput setaf 3)🧪 Skipping not-included $base$(tput sgr0)"
        continue
    fi

    "$SCRIPTDIR"/run.sh "$path"
done

echo "Test runs complete"
exit 0
