package queue

import (
	"context"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
)

// Drain the output tasks, allowing graceful termination
func Drain(ctx context.Context, backend be.Backend, runname string) error {
	c, err := NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return err
	}
	defer c.Stop()

	group, _ := errgroup.WithContext(ctx)
	for o := range c.ListObjects(c.Paths.Bucket, c.finishedMarkers(), true) {
		if o.Err != nil {
			return o.Err
		}

		group.Go(func() error { return c.MarkConsumed(o.Key) })
	}

	return group.Wait()
}
