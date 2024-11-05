#!/usr/bin/env bash

if [[ ! -e ./lunchail ]]
then ./hack/setup/cli.sh
fi

mkdir -p dpk

for i in tests/tests/python*
do ./lunchpail build -o dpk/$(basename "$i") "$i"/pail --target local --create-namespace &
done

wait
