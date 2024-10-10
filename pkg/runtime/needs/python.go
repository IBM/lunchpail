package needs

import (
	"context"
	"errors"
	"os/exec"
)

func InstallPython(ctx context.Context, version string, requirementsPath string, opts Options) (string, error) {
	if _, err := exec.LookPath("python3"); err != nil {
		if errors.Is(err, exec.ErrNotFound) {
			if err := installPython(ctx, version, opts.Verbose); err != nil {
				return "", err
			}
		}
		return "", err
	}
	if requirementsPath != "" {
		return requirementsInstall(ctx, requirementsPath, opts.Verbose)
	}
	return "", nil
}
