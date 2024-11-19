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

# in case tests want to populate an rclone config
export RCLONE_CONFIG=$(mktemp)

# Skip disabled tests
if [[ -e "$1"/.disabled ]]
then
    echo "$(tput setaf 3)🧪 Skipping disabled test $(basename $1)$(tput sgr0)"
    exit 0
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

export TEST_PATH=$(cd "$1" && pwd)
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
# Run and validate output
#
if [[ ${#expected[@]} != 0 ]]
then
    # Undeploy any prior test runs in progress
    undeploy $testname $deployname

    export appname="${deployname-$testname}"
    export TARGET="$TOP"/builds/test/$appname
    export testapp="$TARGET"/test
    rm -rf "$TARGET"
    mkdir -p "$TARGET"

    namespace=${deployname-$testname}

    if [[ -e "$1"/target ]]
    then
        if [[ $(cat "$1"/target) != "${LUNCHPAIL_TARGET:-kubernetes}" ]]
        then
            echo "$(tput setaf 3)🧪 Skipping due to unsupported target $(basename $1)$(tput sgr0)"
            exit 0
        fi
    fi

    build $testname $app $branch $deployname

    if [[ -e "$1"/preinit.sh ]]
    then "$1"/preinit.sh
    fi

    "$SCRIPTDIR"/up.sh $testname &
    # "$testapp" logs -c workstealer -t $LUNCHPAIL_TARGET -f &

    if [[ -e "$1"/init.sh ]]; then
        TEST_NAME=$testname "$1"/init.sh $namespace
    fi

    ${handler-waitForIt} ${deployname:-$testname} ${namespace} $api "${expected[@]}"
    EC=$?

    if [[ $EC != 0 ]]
    then exit $EC
    fi

    if [[ -e "$1"/post.sh ]]
    then TEST_NAME=$testname "$1"/post.sh $namespace
    fi

    undeploy $testname $deployname

    if [[ $(uname) == "Darwin" ]]; then
        CACHEDIR="$HOME/Library/Caches/lunchpail/venvs"
    elif [[ $(uname) == "Linux" ]]; then
        CACHEDIR="$HOME/.cache/lunchpail/venvs"
    fi

    # clean up python venvs if we are in travis or github actions
    if [[ -n "$CI" ]] && [[ -d "$CACHEDIR" ]]
    then
        echo "Cleaning up Python venv $CACHEDIR"
        rm -rf "$CACHEDIR"

        pip3 cache purge
    fi
fi
