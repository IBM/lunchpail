package queue

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
)

// Indicate dispatching is done, with given client
func QdoneClient(ctx context.Context, c S3Client, runname string, opts build.LogOptions) (err error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Done with dispatching\n")
	}

	run := queue.RunContext{Bucket: c.Paths.Bucket, RunName: runname, Step: 0} // FIXME
	return c.Touch(run.Bucket, run.AsFile(queue.DispatcherDoneMarker))
}

// Indicate dispatching is done
func Qdone(ctx context.Context, runname string, opts build.LogOptions) error {
	c, err := NewS3Client(ctx) // pull config from env vars
	if err != nil {
		return err
	}

	return QdoneClient(ctx, c, runname, opts)
}
