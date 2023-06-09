#!/usr/bin/env bash

set -e
set -x

KIND_VERSION=0.19.0
ARCH=${TRAVIS_CPU_ARCH-amd64}

# Install kubectl
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/${ARCH}/kubectl \
    && chmod +x kubectl \
    && sudo mv kubectl /usr/local/bin/

# Install helm
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
sudo ./get_helm.sh
rm get_helm.sh

# Install Kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v${KIND_VERSION}/kind-linux-${ARCH}
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

cat <<EOF > hack/my.secrets.sh
AI_FOUNDATION_GITHUB_USER=$AI_FOUNDATION_GITHUB_USER
AI_FOUNDATION_GITHUB_PAT=$AI_FOUNDATION_GITHUB_PAT
EOF
