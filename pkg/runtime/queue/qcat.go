package queue

import (
	"context"
	"path/filepath"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
)

func Qcat(ctx context.Context, backend be.Backend, run queue.RunContext, path string, que queue.Spec, opts build.LogOptions) error {
	c, err := NewS3ClientForRun(ctx, backend, run, que, opts)
	if err != nil {
		return err
	}
	defer c.Stop()

	fullPath := filepath.Join(run.ListenPrefix(), path)

	if err := c.Cat(run.Bucket, fullPath); err != nil {
		return err
	}

	return nil
}
