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
		fmt.Fprintln(os.Stderr, "Marking worker as done...")
	}

	if err := client.Rm(opts.RunContext.Bucket, opts.RunContext.AsFile(queue.WorkerAliveMarker)); err != nil {
		fmt.Fprintf(os.Stderr, "Error removing alive file %v\n", err)
	} else if err := client.TouchP(opts.RunContext.Bucket, opts.RunContext.AsFile(queue.WorkerDeadMarker), false); err != nil {
		fmt.Fprintf(os.Stderr, "Error touching dead file %v\n", err)
	}

	if opts.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "This worker is shutting down step=%d pool=%s worker=%s\n", opts.RunContext.Step, opts.RunContext.PoolName, opts.RunContext.WorkerName)
	}

	return nil
}
