#!/usr/bin/env bash

set -e

venv="$TEST_PATH"/.venv
reqFile="$TEST_PATH"/pail/requirements.txt

$testapp needs python latest --requirements $reqFile --venv $venv
source "$TEST_PATH"/.venv/bin/activate

echo "$PATH"
