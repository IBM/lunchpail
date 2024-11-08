#!/usr/bin/env bash

if [[ ! -e ./lunchail ]]
then ./hack/setup/cli.sh
fi

mkdir -p dpk

for i in tests/tests/python*
do
    if [[ -z "$1" ]] || [[ "$1" = $(basename "$i") ]]
    then ./lunchpail build -o dpk/$(basename "$i") "$i"/pail --target local --create-namespace &
    fi
done

wait
