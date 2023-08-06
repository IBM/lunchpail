#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

NO_KUBEFLOW=1 "$SCRIPTDIR"/up.sh $@
