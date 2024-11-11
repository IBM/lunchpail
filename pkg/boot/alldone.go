package boot

import (
	"context"
	"fmt"
	"os"
	"strings"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

func waitForAllDone(ctx context.Context, backend be.Backend, run queue.RunContext, opts build.LogOptions) error {
	client, err := s3.NewS3ClientForRun(ctx, backend, run.RunName, opts)
	if err != nil {
		if strings.Contains(err.Error(), "Connection closed") {
			// already gone
			return nil
		}
		return err
	}
	run.Bucket = client.RunContext.Bucket
	defer client.Stop()

	if err := client.WaitTillExists(run.Bucket, run.AsFile(queue.AllDoneMarker)); err != nil {
		return err
	}

	if opts.Verbose {
		fmt.Fprintln(os.Stderr, "Got all done. Cleaning up", run.Step)
	}
	return nil
}
