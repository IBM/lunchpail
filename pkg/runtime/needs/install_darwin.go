package needs

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"os/user"
)

func homedir() (string, error) {
	currentUser, err := user.Current()
	if err != nil {
		return "", err
	}

	return currentUser.HomeDir, nil
}

// We use `brew` and so don't require a special PATH
func bindir() (string, error) {
	return "", nil
}

func installMinio(ctx context.Context, version string, verbose bool) (string, error) {
	if err := setenv(); err != nil { //$HOME must be set for brew
		return "", err
	}

	return "", brewInstall(ctx, "minio/stable/minio", version, verbose) //Todo: versions other than latest
}

func installPython(ctx context.Context, version string, verbose bool) (string, error) {
	if err := setenv(); err != nil { //$HOME must be set for brew
		return "", err
	}

	python := "python@" + version
	if version == "" || version == "latest" {
		python = "python3"
	}
	return "", brewInstall(ctx, python, version, verbose) //Todo: versions other than latest
}

func brewInstall(ctx context.Context, pkg string, version string, verbose bool) error {
	var cmd *exec.Cmd
	if verbose {
		fmt.Fprintf(os.Stderr, "Installing %s release of %s \n", version, pkg)
		cmd = exec.CommandContext(ctx, "brew", "install", "--verbose", "--debug", pkg)
		cmd.Stdout = os.Stderr // Stderr so as not to collide with `lunchpail needs` stdout
	} else {
		cmd = exec.Command("brew", "install", pkg)
	}
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func setenv() error {
	dir, err := homedir()
	if err != nil {
		return err
	}
	return os.Setenv("HOME", dir)
}
