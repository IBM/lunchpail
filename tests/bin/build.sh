#!/usr/bin/env bash

set -eo pipefail

#
# $1: test name
# $2: app path, either a local filepath or a git uri
# $3: [git branch]
# $4: [deploy name] e.g. if we call it test8, but the git repo calls it something else; this is the something else
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/../..

echo "$(tput setaf 2)Deploying testname=$testname testapp=$testapp$(tput sgr0)"

if [[ -n "$3" ]]
then branch="-b $3"
fi

if [[ -f "$SCRIPTDIR"/my.secrets.sh ]]
then
    echo "Injecting your secrets"
    . "$SCRIPTDIR"/my.secrets.sh
fi

# Allows us to capture workstealer info before it auto-terminates
export LUNCHPAIL_SLEEP_BEFORE_EXIT=10

if [ -z "$LUNCHPAIL_BUILD_NOT_NEEDED" ]
then "$TOP"/hack/setup/cli.sh /tmp/lunchpail
fi

repo_secret="" # e.g. user:pat@https://github.mycompany.com

# intentionally setting some critical values at build time to the
# final value, and some critical values to bogus values that are then
# overridden by final values at shrinkwrap time
/tmp/lunchpail build --verbose=${VERBOSE:-false} \
               -o $testapp.tmp \
               $branch \
               $repo_secret \
               $2


# Pull in a `values` file if it exists. This allows for test coverage
# of `--set` command line values, e.g. that they are correctly
# propagated to the running code. Note that we intentionally attach
# these values at build rather than up time (though up time would
# work, too) so that `down` calls can pick up those values, too.
if [[ -e "$2"/../values ]]
then
    values_filepath=$(realpath "$2"/../values)
    # make sure to get an absolute path to the values filepath below:
    values_from_pail="$(cat "$values_filepath" | sed -E "s#(--set-file [^=]+=)#\1$(dirname $values_filepath)/#g")"
    echo "Using these values from the application definition: $values_from_pail"
fi

# intentionally test passing a valid target at build time that is
# different from the desired target, to test that the ./up.sh --target
# options overrides this build-time one
buildTimeTarget=local
if [ "$LUNCHPAIL_TARGET" = "local" ]
then buildTimeTarget=kubernetes
fi

# test coverage for re-build
$testapp.tmp build -v \
             -o $testapp \
             $values_from_pail \
             --target=$buildTimeTarget \
             --create-namespace
rm -f $testapp.tmp

# validate the built-in target (TODO add a '$testapp values platform' command?)
actualBuildTimeTarget=$($testapp info | grep platform: | awk '{print $2}')
if [ "$buildTimeTarget" = "$actualBuildTimeTarget" ]
then echo "✅ PASS Build-time target $buildTimeTarget"
else echo "❌ FAIL Build-time target expected!=actual '$$buildTimeTarget'!='$actualBuildTimeTarget'" && exit 1
fi

if [[ -d "$2" ]] && [[ -f "$2"/version ]]
then
    # Check that app version passes through
    expectedAppVersion=$(cat "$2"/version)
    actualAppVersion=$($testapp version | grep 'Application Version' | awk '{print $NF}')
    if [[ "$expectedAppVersion" = "$actualAppVersion" ]]
    then echo "✅ PASS App Version passthrough $expectedAppVersion"
    else echo "❌ FAIL App Version passthrough expected!=actual '$expectedAppVersion'!='$actualAppVersion'" && exit 1
    fi
fi
