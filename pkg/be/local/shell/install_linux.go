package shell

import (
	"os"
	"os/exec"
	"path/filepath"
)

func bindir() (string, error) {
	cachedir, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(cachedir, "lunchpail", "bin"), nil
}

func installMinio() error {
	dir, err := bindir()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	cmd := exec.Command("wget", "https://dl.min.io/server/minio/release/linux-amd64/minio")
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return err
	}

	return os.Chmod(filepath.Join(dir, "minio"), 0755)
}

func setenvForMinio() error {
	dir, err := bindir()
	if err != nil {
		return err
	}
	return os.Setenv("PATH", os.Getenv("PATH")+":"+dir)
}
