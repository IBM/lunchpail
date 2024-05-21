package init

import (
	"fmt"
	which "github.com/hairyhenderson/go-which"
	"os"
	"os/exec"
	"runtime"
)

func getKind() error {
	if which.Found("kind") {
		fmt.Println("Kind: installed")
	} else {
		fmt.Println("Kind: installing")
		kos := runtime.GOOS
		karch := runtime.GOARCH

		cmd := exec.Command("sh", "-c", "curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-"+kos+"-"+karch+" && chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind")
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Start(); err != nil {
			return err
		}
		if err := cmd.Wait(); err != nil {
			return err
		}

		return nil

		//     if lspci | grep -iq nvidia; then
		//         # we will need a special kind build, for now
		//         apt_update
		//         sudo DEBIAN_FRONTEND=noninteractive apt -y install build-essential
		//         pushd /tmp
		//         git clone https://github.com/jacobtomlinson/kind.git
		//         cd kind
		//         git branch gpu && git pull origin gpu
		//         make
		//         sudo mv ./bin/kind /usr/local/bin/kind
		//     else
		//         curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-$(kos)-$(karch)
		//         chmod +x ./kind
		//         sudo mv ./kind /usr/local/bin/kind
		//     fi
		// fi
	}

	return nil
}

func createKindCluster() error {
	clusterName := "jaas" // TODO
	cmd := exec.Command("sh", "-c", "kind get clusters | grep -q "+clusterName)
	if err := cmd.Run(); err != nil {
		args := []string{"create", "cluster", "--wait", "10m", "--name", clusterName}

		// allows selectively hacking kind cluster config; e.g. see ./travis/setup.sh
		if _, err := os.Stat("/tmp/kindhack.yaml"); err == nil {
			fmt.Println("Hacking kind cluster config")
			args = append(args, "--config")
			args = append(args, "/tmp/kindhack.yaml")
		}

		fmt.Printf("Creating kind cluster " + clusterName)

		cmd := exec.Command("kind", args...)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return err
		}
	}

	return nil
}
