package shell

import (
	"os"
	"os/exec"
)

func installMinio() error {
	return brewInstall("minio/stable/minio")
}

func brewInstall(pkg string) error {
	cmd := exec.Command("brew", "install", pkg)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func setenvForMinio() error {
	// nothing to do
	return nil
}
