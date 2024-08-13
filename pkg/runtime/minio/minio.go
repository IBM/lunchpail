package minio

import (
	"os"
	"os/exec"
)

func launchMinioServer() error {
	if os.Getenv("MINIO_ENABLED") != "" {
		datadir := os.Getenv("MINIO_DATA_DIR")
		if datadir == "" {
			datadir = "./data"
		}
		if err := os.MkdirAll(datadir, 0700); err != nil {
			return err
		}

		cmd := exec.Command("minio", "server", datadir)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		if err := cmd.Run(); err != nil {
			return err
		}
	}

	return nil
}
