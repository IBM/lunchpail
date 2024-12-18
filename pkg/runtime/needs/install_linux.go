package needs

import (
	"context"
	"fmt"
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

func installMinio(ctx context.Context, version string, verbose bool) (string, error) {
	dir, err := bindir()
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	//Todo: versions other than latest
	cmd := exec.CommandContext(ctx, "wget", "https://dl.min.io/server/minio/release/linux-amd64/minio")
	cmd.Dir = dir
	if verbose {
		cmd.Stdout = os.Stderr
	}
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return "", err
	}

	if err := setenv(dir); err != nil { //setting $PATH
		return "", err
	}

	return dir, os.Chmod(filepath.Join(dir, "minio"), 0755)
}

func installPython(ctx context.Context, version string, verbose bool) (string, error) {
	if version == "" || version == "latest" {
		version = "3"
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Checking for existence of python%s\n", version)
	}

	if _, err := exec.LookPath("python" + version); err != nil {
		fmt.Fprintf(os.Stderr, "Installing python%s\n", version)

		var cmdline string
		sudo := "sudo"
		if _, err := exec.LookPath("sudo"); err != nil {
			sudo = ""
		}
		if _, err := exec.LookPath("apt"); err == nil {
			if version >= "3.12" { //package python-distutils deprecated in 3.12 and beyond
				cmdline = fmt.Sprintf("%s add-apt-repository -y ppa:deadsnakes/ppa && %s apt update && %s apt install -y python%s python%s-venv && curl -sS https://bootstrap.pypa.io/get-pip.py | python%s && which python%s", sudo, sudo, sudo, version, version, version, version)
			} else {
				cmdline = fmt.Sprintf("%s add-apt-repository -y ppa:deadsnakes/ppa && %s apt update && %s apt install -y python%s python%s-venv python%s-distutils && curl -sS https://bootstrap.pypa.io/get-pip.py | python%s && which python%s", sudo, sudo, sudo, version, version, version, version, version)
			}
		}

		if cmdline != "" {
			if verbose {
				fmt.Fprintf(os.Stderr, "Installing python%s via command line %s\n", version, cmdline)
			}
			cmd := exec.CommandContext(ctx, "/bin/sh", "-c", cmdline)
			cmd.Stdout = os.Stderr // Stderr so as not to collide with `lunchpail needs` stdout
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				return "", err
			}
			fmt.Fprintf(os.Stderr, "Successfully installed python%s\n", version)
		} else {
			return "", fmt.Errorf("Unable to install required python version %s", version)
		}
	}

	return "", nil
}

func setenv(dir string) error {
	return os.Setenv("PATH", os.Getenv("PATH")+":"+dir)
}
