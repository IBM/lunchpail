package queue

import (
	"context"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/ir/queue"
)

// Drain the output tasks, allowing graceful termination
func Drain(ctx context.Context, backend be.Backend, runname string) error {
	c, err := NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return err
	}
	defer c.Stop()

	run := queue.RunContext{Bucket: c.Paths.Bucket, RunName: runname, Step: 0} // FIXME
	outbox := run.AsFile(queue.AssignedAndFinished)

	group, _ := errgroup.WithContext(ctx)
	for o := range c.ListObjects(run.Bucket, outbox, true) {
		if o.Err != nil {
			return o.Err
		}

		group.Go(func() error { return c.Rm(run.Bucket, o.Key) })
	}

	return group.Wait()
}
