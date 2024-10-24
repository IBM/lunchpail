package queue

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
)

// Indicate dispatching is done, with given client
func QdoneClient(ctx context.Context, c S3Client, run queue.RunContext, opts build.LogOptions) (err error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Done with dispatching\n")
	}

	if err := c.Mkdirp(run.Bucket); err != nil {
		return err
	}

	return c.TouchP(run.Bucket, run.AsFile(queue.DispatcherDoneMarker), false)
}

// Indicate dispatching is done
func Qdone(ctx context.Context, run queue.RunContext, opts build.LogOptions) error {
	c, err := NewS3Client(ctx) // pull config from env vars
	if err != nil {
		return err
	}

	return QdoneClient(ctx, c, run, opts)
}
