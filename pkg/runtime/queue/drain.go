package queue

import (
	"context"
	"fmt"
	"os"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
)

// Drain the output tasks, allowing graceful termination
func Drain(ctx context.Context, backend be.Backend, run queue.RunContext, que queue.Spec, opts build.LogOptions) error {
	c, err := NewS3ClientForRun(ctx, backend, run, que, opts)
	if err != nil {
		return err
	}
	defer c.Stop()
	run.Bucket = c.RunContext.Bucket // TODO

	outbox := run.AsFile(queue.AssignedAndFinished)

	group, _ := errgroup.WithContext(ctx)
	for o := range c.ListObjects(run.Bucket, outbox, true) {
		if o.Err != nil {
			return o.Err
		}

		if opts.Verbose {
			fmt.Fprintln(os.Stderr, "Draining", o.Key)
		}
		group.Go(func() error { return c.Rm(run.Bucket, o.Key) })
	}

	return group.Wait()
}
