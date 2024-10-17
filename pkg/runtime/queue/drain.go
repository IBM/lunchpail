package queue

import (
	"context"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/fe/transformer/api"
)

// Drain the output tasks, allowing graceful termination
func Drain(ctx context.Context, backend be.Backend, runname string) error {
	c, err := NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return err
	}
	defer c.Stop()

	args := api.PathArgs{Bucket: c.Paths.Bucket, RunName: runname, Step: 0} // FIXME
	outbox := args.TemplateP(api.AssignedAndFinished)

	group, _ := errgroup.WithContext(ctx)
	for o := range c.ListObjects(args.Bucket, outbox, true) {
		if o.Err != nil {
			return o.Err
		}

		group.Go(func() error { return c.Rm(args.Bucket, o.Key) })
	}

	return group.Wait()
}
