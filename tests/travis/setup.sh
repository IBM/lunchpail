#!/usr/bin/env bash

set -e
set -o pipefail
set -x

ARCH=${TRAVIS_CPU_ARCH-amd64}

cat <<EOF > hack/my.secrets.sh
AI_FOUNDATION_GITHUB_USER=$AI_FOUNDATION_GITHUB_USER
AI_FOUNDATION_GITHUB_PAT=$AI_FOUNDATION_GITHUB_PAT
EOF
