#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
IN=$1
N=${2-10}

venv=/tmp/codeflare-trim-parquet-venv
if [[ ! -e /tmp/codeflare-trim-parquet-venv ]]; then
    python3 -m venv $venv
    source $venv/bin/activate
    pip3 install pyarrow
else
    source $venv/bin/activate
fi

OUT="$(dirname $IN)/first-$N-$(basename $IN)"
python3 "$SCRIPTDIR"/trim-parquet.py $IN $OUT $N
