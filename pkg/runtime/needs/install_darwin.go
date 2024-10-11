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

	return "", brewInstall(ctx, "python3", version, verbose) //Todo: versions other than latest
}

func brewInstall(ctx context.Context, pkg string, version string, verbose bool) error {
	var cmd *exec.Cmd
	if verbose {
		fmt.Fprintf(os.Stdout, "Installing %s release of %s \n", version, pkg)
		cmd = exec.CommandContext(ctx, "brew", "install", "--verbose", "--debug", pkg)
		cmd.Stdout = os.Stdout
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
