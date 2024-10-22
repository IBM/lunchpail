package worker

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

func PreStop(ctx context.Context, opts Options) error {
	client, err := s3.NewS3Client(ctx)
	if err != nil {
		return err
	}

	if opts.LogOptions.Debug {
		fmt.Println("Marking worker as done...")
	}

	client.Rm(opts.RunContext.Bucket, opts.RunContext.AsFile(queue.WorkerAliveMarker))
	client.Touch(opts.RunContext.Bucket, opts.RunContext.AsFile(queue.WorkerDeadMarker))

	if opts.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "This worker is shutting down pool=%s worker=%s\n", opts.RunContext.PoolName, opts.RunContext.WorkerName)
	}

	return nil
}
