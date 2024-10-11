package needs

import (
	"context"
	"errors"
	"os/exec"
)

func InstallMinio(ctx context.Context, version string, opts Options) (string, error) {
	if _, err := exec.LookPath("minio"); err != nil {
		if errors.Is(err, exec.ErrNotFound) {
			return installMinio(ctx, version, opts.Verbose)
		}
		return "", err
	}
	return "", nil
}
