package needs

import (
	"context"
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
		cmd.Stdout = os.Stdout
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

	return "", nil
}

func setenv(dir string) error {
	return os.Setenv("PATH", os.Getenv("PATH")+":"+dir)
}
