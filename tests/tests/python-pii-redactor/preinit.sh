#!/usr/bin/env bash

set -e

venv="$TEST_PATH"/.venv

if [ ! -d "$venv" ]
then python3 -m venv "$venv" 1>&2
fi

source "$TEST_PATH"/.venv/bin/activate

if [ ! -f "$venv"/requirements.txt ] || ! diff -q "$venv"/requirements.txt "$TEST_PATH"/pail/requirements.txt
then
    pip3 install -r "$TEST_PATH"/pail/requirements.txt 1>&2
    cp "$TEST_PATH"/pail/requirements.txt "$TEST_PATH"/.venv
fi

echo "$PATH"
