package needs

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
)

func InstallMinio(ctx context.Context, version string, opts Options) (string, error) {
	// We may have installed minio in a special place. Before we
	// can call LookPath, make sure that special place is on PATH.
	dir, err := bindir()
	if err != nil {
		return "", err
	}

	if dir != "" {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "needs minio adding dir to PATH=%s\n", dir)
		}
		os.Setenv("PATH", os.Getenv("PATH")+":"+dir)
	}

	if _, err := exec.LookPath("minio"); err != nil {
		if errors.Is(err, exec.ErrNotFound) {
			if opts.Verbose {
				fmt.Fprintln(os.Stderr, "needs minio installing minio")
			}
			return installMinio(ctx, version, opts.Verbose)
		}
		return "", err
	}
	if opts.Verbose {
		fmt.Fprintln(os.Stderr, "needs minio found minio")
	}
	return dir, nil
}
