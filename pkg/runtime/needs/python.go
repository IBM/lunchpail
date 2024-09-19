package needs

import (
	"context"
	"errors"
	"os"
	"os/exec"
)

func InstallPython(ctx context.Context, version string, venvPath string, requirementsPath string, opts Options) error {
	if _, err := exec.LookPath("python3"); err != nil {
		if errors.Is(err, exec.ErrNotFound) {
			if err := installPython(ctx, version, opts.Verbose); err != nil {
				return err
			}
		}
		return err
	}
	if requirementsPath != "" {
		if venvPath == "" {
			venvPath = ".venv"
		}
		if err := os.MkdirAll(venvPath, os.ModePerm); err != nil {
			return err
		}
		return requirementsInstall(ctx, venvPath, requirementsPath, opts.Verbose)
	}
	return nil
}
