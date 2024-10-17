package queue

import (
	"context"
	"path/filepath"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/fe/transformer/api"
)

func Qcat(ctx context.Context, backend be.Backend, runname, path string) error {
	c, err := NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return err
	}
	defer c.Stop()

	args := api.PathArgs{Bucket: c.Paths.Bucket, RunName: runname, Step: 0} // FIXME
	fullPath := filepath.Join(args.ListenPrefix(), path)

	if err := c.Cat(args.Bucket, fullPath); err != nil {
		return err
	}

	return nil
}
