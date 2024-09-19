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

func installMinio(ctx context.Context, version string, verbose bool) error {
	if verbose {
		fmt.Printf("Installing %s release of minio \n", version)
	}

	dir, err := bindir()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	//Todo: versions other than latest
	cmd := exec.CommandContext(ctx, "/bin/sh", "-c", "apt update; apt -y install wget; wget https://dl.min.io/server/minio/release/linux-amd64/minio")
	cmd.Dir = dir
	if verbose {
		cmd.Stdout = os.Stdout
	}
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return err
	}

	if err := setenv(dir); err != nil { //setting $PATH
		return err
	}

	return os.Chmod(filepath.Join(dir, "minio"), 0755)
}

func installPython(ctx context.Context, version string, verbose bool) error {
	/*
			if verbose {
			fmt.Fprintf(os.Stdout, "Installing %s release of python \n", version)
		}

			dir, err := bindir()
			if err != nil {
				return err
			}

			if err := os.MkdirAll(dir, 0755); err != nil {
				return err
			}

			//Todo: versions other than latest
			cmd := exec.Command("wget", "https://www.python.org/ftp/python/3.12.7/Python-3.12.7.tgz")
			cmd.Dir = dir
			if verbose {
				cmd.Stdout = os.Stdout
			}
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				return err
			}

			cmd = exec.Command("tar", "xf", "Python-3.12.7.tgz")
			cmd.Dir = dir
			if verbose {
				cmd.Stdout = os.Stdout
			}
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				return err
			}

			if err := setenv(dir); err != nil { //setting $PATH
				return err
			}

			os.Chmod(filepath.Join(dir, "python"), 0755)
	*/

	return nil
}

func requirementsInstall(ctx context.Context, venvPath string, requirementsPath string, verbose bool) error {
	var cmd *exec.Cmd
	var verboseFlag string
	dir := filepath.Dir(venvPath)

	if verbose {
		verboseFlag = "--verbose"
	}

	venvRequirementsPath := filepath.Join(venvPath, filepath.Base(requirementsPath))
	cmds := fmt.Sprintf(`python3 -m venv %s
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

func setenv(dir string) error {
	return os.Setenv("PATH", os.Getenv("PATH")+":"+dir)
}
