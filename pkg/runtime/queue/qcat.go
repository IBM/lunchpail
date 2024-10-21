package queue

import (
	"context"
	"path/filepath"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/ir/queue"
)

func Qcat(ctx context.Context, backend be.Backend, runname, path string) error {
	c, err := NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return err
	}
	defer c.Stop()

	run := queue.RunContext{Bucket: c.Paths.Bucket, RunName: runname, Step: 0} // FIXME
	fullPath := filepath.Join(run.ListenPrefix(), path)

	if err := c.Cat(run.Bucket, fullPath); err != nil {
		return err
	}

	return nil
}
