package queue

import (
	"context"
	"path/filepath"

	"lunchpail.io/pkg/be"
)

func Qcat(ctx context.Context, backend be.Backend, runname, path string) error {
	c, err := NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return err
	}
	defer c.Stop()

	prefix := filepath.Join(c.Paths.Prefix, path)
	if err := c.Cat(c.Paths.Bucket, prefix); err != nil {
		return err
	}

	return nil
}
