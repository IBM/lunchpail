package init

func getNvidia() error {
	// if [[ $(uname) = Linux ]]; then
	// 	if lspci | grep -iq nvidia; then
	//         CLUSTER_CONFIG="--config $SCRIPTDIR/cluster-gpus.yaml"

	//         if ! which nvidia-smi > /dev/null 2>&1; then
	// 		echo "$(tput setaf 2)Installing nvidia drivers$(tput sgr0)"
	// 		wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
	// 		sudo dpkg -i cuda-keyring_1.1-1_all.deb
	// 		rm cuda-keyring_1.1-1_all.deb
	// 		apt update
	// 		sudo DEBIAN_FRONTEND=noninteractive apt -y install cuda nvidia-container-runtime jq
	// 		sudo nvidia-ctk runtime configure
	//             cat /etc/docker/daemon.json | jq --arg defaultRuntime nvidia '. + {"default-runtime": $defaultRuntime}' > /tmp/daemon.json
	//             sudo mv /tmp/daemon.json /etc/docker/daemon.json
	//             sudo systemctl restart docker
	//             # sudo sed -ie 's/^#accept-nvidia-visible-devices-as-volume-mounts = false/accept-nvidia-visible-devices-as-volume-mounts = true/' /etc/nvidia-container-runtime/config.toml
	//         fi
	// 	fi
	// fi

	return nil
}
