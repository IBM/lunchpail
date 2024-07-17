package build

import (
	"fmt"
	which "github.com/hairyhenderson/go-which"
)

type ContainerCli string

const (
	Podman ContainerCli = "podman"
	Docker ContainerCli = "docker"
)

func WhichContainerCli() (ContainerCli, error) {
	if which.Found("docker") {
		return "docker", nil
	} else if which.Found("podman") {
		return "podman", nil
	} else {
		return "", fmt.Errorf("No container CLI found")
	}
}
