package needs

import (
	"context"
	"errors"
	"os/exec"
)

func InstallPython(ctx context.Context, version, requirements string, opts Options) (string, error) {
	if version == "" || version == "latest" {
		version = "3"
	}

	if _, err := exec.LookPath("python" + version); err != nil {
		if errors.Is(err, exec.ErrNotFound) {
			if _, err := installPython(ctx, version, opts.Verbose); err != nil {
				return "", err
			}
		}
	}
	if requirements != "" {
		//returns bin path where installed
		return requirementsInstall(ctx, version, requirements, opts.Verbose)
	}
	return "", nil
}
