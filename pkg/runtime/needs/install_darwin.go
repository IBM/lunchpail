package needs

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
)

func homedir() (string, error) {
	currentUser, err := user.Current()
	if err != nil {
		return "", err
	}

	return currentUser.HomeDir, nil
}

func installMinio(ctx context.Context, version string, verbose bool) error {
	if err := setenv(); err != nil { //$HOME must be set for brew
		return err
	}

	return brewInstall(ctx, "minio/stable/minio", version, verbose) //Todo: versions other than latest
}

func installPython(ctx context.Context, version string, verbose bool) error {
	if err := setenv(); err != nil { //$HOME must be set for brew
		return err
	}

	return brewInstall(ctx, "python3", version, verbose) //Todo: versions other than latest
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

func requirementsInstall(ctx context.Context, venvPath string, requirementsPath string, verbose bool) error {
	var cmd *exec.Cmd
	var verboseFlag string
	dir := filepath.Dir(venvPath)

	if verbose {
		verboseFlag = "--verbose"
	}

	venvRequirementsPath := filepath.Join(venvPath, filepath.Base(requirementsPath))
	cmds := fmt.Sprintf(`python3 -m venv %s 1>&2
cp %s %s
source %s/bin/activate
python3 -m pip install --upgrade pip %s
pip3 install -r %s %s 1>&2`, venvPath, requirementsPath, venvPath, venvPath, verboseFlag, venvRequirementsPath, verboseFlag)

	cmd = exec.CommandContext(ctx, "/bin/bash", "-c", cmds)
	cmd.Dir = dir
	if verbose {
		cmd.Stdout = os.Stdout
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
