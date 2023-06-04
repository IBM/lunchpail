#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

PLA=$(grep name "$SCRIPTDIR"/../platform/deploy/Chart.yaml | awk '{print $2}')
IBM=$(grep name "$SCRIPTDIR"/../ibm/Chart.yaml | awk '{print $2}')
RUN=$(grep name "$SCRIPTDIR"/../tests/run/Chart.yaml | awk '{print $2}')

# for local testing
LOCAL_CLUSTER_NAME=codeflare-platform

while getopts "k:" opt
do
    case $opt in
        k) NO_KIND=true; export KUBECONFIG=${OPTARG}; continue;;
    esac
done
shift $((OPTIND-1))

if [[ -z "$NO_KIND" ]]; then
    VERSION=dev
else
    VERSION=0.0.1 # FIXME
    # IMAGE_REPO= # FIXME
fi


