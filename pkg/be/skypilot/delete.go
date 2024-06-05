package skypilot

import (
	"fmt"
	"os"
	"os/exec"
)

func stopOrDownSkyCluster(name string, down bool) error {
	cmd := exec.Command("/bin/bash", "-c", "env DOCKER_HOST=unix:///var/run/docker.sock docker exec sky sky stop --yes "+name)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("Internal Error running SkyPilot stop cmd: %v", err)
	}

	if down {
		cmd = exec.Command("/bin/bash", "-c", "env DOCKER_HOST=unix:///var/run/docker.sock docker exec sky sky down --yes "+name+" ; docker stop sky")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("Internal Error running SkyPilot down cmd: %v", err)
		}
	}
	return nil
}
