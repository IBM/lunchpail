#!/usr/bin/env bash

#
# This script is intended to be run before any helm installs. I don't
# know of a way to do this declaratively from our Chart.yaml :(
#

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
cd "$SCRIPTDIR"

if [[ ! -e scheduler-plugins ]] && [[ -n "$NEEDS_GANG_SCHEDULING" ]]
then
    SCHEDULER_PLUGINS=v0.27.8
    rm -rf scheduler-plugins
    git clone https://github.com/kubernetes-sigs/scheduler-plugins.git --no-checkout --filter=blob:none -b $SCHEDULER_PLUGINS scheduler-plugins
    (cd scheduler-plugins && \
         git sparse-checkout set --cone manifests && \
         git checkout $SCHEDULER_PLUGINS)
else
    # ugh, make `helm dependency update` happy
    mkdir -p scheduler-plugins/manifests/install/charts/as-a-second-scheduler/
    cat <<EOF > scheduler-plugins/manifests/install/charts/as-a-second-scheduler/Chart.yaml
name: scheduler-plugins
version: 0.26.7
EOF
fi
