#!/usr/bin/env bash

set -e
set -o pipefail
set -x

ARCH=${TRAVIS_CPU_ARCH-amd64}

cat <<EOF > hack/my.secrets.sh
AI_FOUNDATION_GITHUB_USER=$AI_FOUNDATION_GITHUB_USER
AI_FOUNDATION_GITHUB_PAT=$AI_FOUNDATION_GITHUB_PAT

COS_ACCESS_KEY=$COS_ACCESS_KEY
COS_SECRET_KEY=$COS_SECRET_KEY
EOF

if ! which helm >& /dev/null
then
    echo "$(tput setaf 2)Installing helm$(tput sgr0)"
    curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
    chmod 700 get_helm.sh
    ./get_helm.sh
    rm get_helm.sh
fi

# ibm travis currently runs ubuntu 20, for which there are no podman
# v4 builds. We rely on v4 for the `podman machine init --rootful`
# option
# if ! which podman >& /dev/null
# then
#     echo "Installing podman"
#     sudo apt update
#     sudo apt -y install podman
#
#     podman machine init --rootful
#     podman machine start
# fi
