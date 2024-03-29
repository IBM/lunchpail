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

undeploy
up
watch

# test app not found
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

    # skip over disabled tests
    if [[ -e "$path"/.disabled ]]
    then
        echo "$(tput setaf 3)🧪 Skipping disabled test $base$(tput sgr0)"
        continue
    fi

    echo "$(tput setaf 2)🧪 Commencing test $base$(tput sgr0)"

    unset api
    unset app
    unset branch
    unset taskqueue
    unset handler
    unset namespace
    unset testname
    unset deployname
    expected=()

    . "$path"/settings.sh

    testname="${testname-$(basename $path)}"

    if [[ -z "$app" ]]
    then app=$TOP/tests/helm/templates/applications/$testname
    fi
    
    if [[ -e "$path"/data.sh ]]; then
        echo "$(tput setaf 2)🧪 Copying in data for $testname$(tput sgr0)" 1>&2
        echo ""
        "$path"/data.sh
        "$TOP"/hack/s3-copyin.sh
        echo "✅ Done copying in data for $testname"
    fi
    
    if [[ ${#expected[@]} != 0 ]]
    then
        deploy $testname $app $branch $deployname

        if [[ -e "$path"/init.sh ]]; then
            TEST_NAME=$testname "$path"/init.sh
        fi
        
        ${handler-waitForIt} ${deployname:-$testname} ${namespace-$NAMESPACE_USER} $api "${expected[@]}"
        EC=$?
        undeploy $testname

        if [[ $EC != 0 ]]
        then exit $EC
        fi
    fi
done

echo "Test runs complete"
exit 0
