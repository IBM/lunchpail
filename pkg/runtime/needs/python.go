package needs

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
)

func InstallPython(ctx context.Context, version, requirements string, opts Options) (string, error) {
	if version == "" || version == "latest" {
		version = "3"
	}

	path, err := exec.LookPath("python" + version)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Python install err %v\n", err)
		if errors.Is(err, exec.ErrNotFound) {
			if _, err := installPython(ctx, version, opts.Verbose); err != nil {
				return "", err
			}
		}
	}
	fmt.Fprintf(os.Stderr, "Python install path %s, err %v\n", path, err)
	if requirements != "" {
		//returns bin path where installed
		return requirementsInstall(ctx, version, requirements, opts.Verbose)
	}
	return "", nil
}
