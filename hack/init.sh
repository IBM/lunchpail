#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
. "$SCRIPTDIR"/settings.sh

#
# Goal: Level set the current host, e.g. kind, docker, ...
#
# Notes:
#
# 1) re: the DEBIAN_FRONTEND=noninteractive below, this is to prevent
#    ubuntu dialog hang on "Restarting services..."
#

function karch {
    if [[ $(uname -m) = x86_64 ]]; then
        echo amd64
    else
        echo arm64
    fi
}

function kos {
    uname | tr "[:upper:]" "[:lower:]"
}

function apt_update {
    if [[ -z $DID_APT_UPDATE ]]; then
        # sometimes we race with ubuntu updating itself
        sudo apt update || sudo apt update || sudo apt update || sudo apt update
        DID_APT_UPDATE=1
    fi
}

function get_docker {
    if ! which docker >& /dev/null; then
        echo "$(tput setaf 2)Installing docker$(tput sgr0)"
        apt_update
        sudo DEBIAN_FRONTEND=noninteractive apt -y install apt-transport-https ca-certificates curl software-properties-common
        sudo rm -f /usr/share/keyrings/docker-archive-keyring.gpg
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt update

        apt-cache policy docker-ce
        sudo DEBIAN_FRONTEND=noninteractive apt -y install docker-ce

        if [[ $USER != root ]]; then
            sudo usermod -aG docker ${USER}
            su - ${USER}
            groups | grep docker
        fi
    fi
}

function get_helm {
    if ! which helm >& /dev/null; then
        echo "$(tput setaf 2)Installing helm$(tput sgr0)"
        curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
        chmod 700 get_helm.sh
        ./get_helm.sh
	rm get_helm.sh
    fi
}

function get_minio_client {
    if ! which mc >& /dev/null; then
        echo "$(tput setaf 2)Installing minio client$(tput sgr0)"

        if [[ $(uname) = "Darwin" ]]
        then
            brew install minio/stable/minio
        elif [[ $(uname) = "Linux" ]]
        then
            if [[ $(uname -m) = "aarch64" ]]
            then
                local mc_arch=arm64
            else
                local mc_arch=amd64
            fi
            curl https://dl.min.io/client/mc/release/linux-${mc_arch}/mc \
                 --create-dirs \
                 -o mc

            chmod +x mc
            sudo mv mc /usr/local/bin
        else
            echo "Platform not supported for minio client: $(uname)"
            exit 1
        fi
    fi
}

function get_kubectl {
    if ! which kubectl >& /dev/null; then
        echo "$(tput setaf 2)Installing kubectl$(tput sgr0)"
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/$(kos)/$(karch)/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin
    fi
}

function get_kind {
    if ! which kind >& /dev/null; then
        echo "$(tput setaf 2)Installing kind$(tput sgr0)"

        if lspci | grep -iq nvidia; then
            # we will need a special kind build, for now
            apt_update
            sudo DEBIAN_FRONTEND=noninteractive apt -y install build-essential
            pushd /tmp
            git clone https://github.com/jacobtomlinson/kind.git
            cd kind
            git branch gpu && git pull origin gpu
            make
            sudo mv ./bin/kind /usr/local/bin/kind
        else
            curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-$(kos)-$(karch)
            chmod +x ./kind
            sudo mv ./kind /usr/local/bin/kind
        fi
    fi
}

function get_nvidia {
    if [[ $(uname) = Linux ]]; then
	if lspci | grep -iq nvidia; then
            CLUSTER_CONFIG="--config $SCRIPTDIR/cluster-gpus.yaml"

            if ! which nvidia-smi; then
		echo "$(tput setaf 2)Installing nvidia drivers$(tput sgr0)"
		wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
		sudo dpkg -i cuda-keyring_1.1-1_all.deb
		rm cuda-keyring_1.1-1_all.deb
		apt update
		sudo DEBIAN_FRONTEND=noninteractive apt -y install cuda nvidia-container-runtime jq
		sudo nvidia-ctk runtime configure
                cat /etc/docker/daemon.json | jq --arg defaultRuntime nvidia '. + {"default-runtime": $defaultRuntime}' > /tmp/daemon.json
                sudo mv /tmp/daemon.json /etc/docker/daemon.json
                sudo systemctl restart docker
                # sudo sed -ie 's/^#accept-nvidia-visible-devices-as-volume-mounts = false/accept-nvidia-visible-devices-as-volume-mounts = true/' /etc/nvidia-container-runtime/config.toml
            fi
	fi
    fi
}

function create_kind_cluster {
    if [[ -z "$NO_KIND" ]]; then
        if ! kind get clusters | grep -q $CLUSTER_NAME; then
            echo "Creating kind cluster $(tput setaf 6)$CLUSTER_NAME $CLUSTER_CONFIG$(tput sgr0)" 1>&2
            kind create cluster --name $CLUSTER_NAME --wait 10m $CLUSTER_CONFIG
        fi
    fi
}

function update_helm_dependencies {
    # i'm not sure how to manage this without hard-coding the
    # sub-charts that pull in external dependencies
    helm dependency update "$SCRIPTDIR"/../platform
}

get_minio_client
get_kubectl
get_helm
get_docker

if [[ -z "$CODEFLARE_PREP_INIT" ]]; then
    # allows us to do some docker builds in parallel with these expensive steps
    update_helm_dependencies
    get_kind
    get_nvidia
    create_kind_cluster
fi
