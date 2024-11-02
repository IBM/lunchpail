package init

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"

	which "github.com/hairyhenderson/go-which"
)

func getContainerCli() error {
	// # Linux doesn't need a podman machine
	// if [[ $(uname) = Linux ]]
	// then return
	// fi

	return getPodman()
}

func podmanMachineExists() bool {
	if machineCount, err := exec.Command("sh", "-c", "podman machine list --noheading | wc -l | xargs").Output(); err != nil || strings.TrimSpace(string(machineCount)) == "0" {
		return false
	} else {
		return true
	}
}

func createPodmanMachine() error {
	fmt.Fprintln(os.Stderr, "Creating podman machine")

	cmd := exec.Command("podman", "machine", "init", "--memory", "8192", "--now")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		return err
	}

	return nil
}

func podmanMachineRunning() bool {
	cmd := exec.Command("sh", "-c", "podman machine inspect | grep State | grep -q running")
	if err := cmd.Run(); err != nil {
		return false
	}

	return true
}

func startPodmanMachine() error {
	fmt.Fprintln(os.Stderr, "Starting podman machine")

	cmd := exec.Command("podman", "machine", "start")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		return err
	}

	return nil
}

func getPodman() error {
	if which.Found("podman") {
		fmt.Println("Container CLI: podman")

		if runtime.GOOS != "linux" {
			if machineExists := podmanMachineExists(); !machineExists {
				if err := createPodmanMachine(); err != nil {
					return err
				}
			} else if running := podmanMachineRunning(); !running {
				if err := startPodmanMachine(); err != nil {
					return err
				}
			}
		}
	} else if which.Found("docker") {
		fmt.Println("Container CLI: docker")
	}

	return nil
}
