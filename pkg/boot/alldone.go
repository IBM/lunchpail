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

func waitForAllDone(ctx context.Context, backend be.Backend, run queue.RunContext, que queue.Spec, opts build.LogOptions) error {
	client, err := s3.NewS3ClientForRun(ctx, backend, run, que, opts)
	if err != nil {
		if strings.Contains(err.Error(), "Connection closed") {
			// already gone
			return nil
		}
		return err
	}
	defer client.Stop()

	if err := client.WaitTillExists(client.RunContext.Bucket, client.RunContext.AsFile(queue.AllDoneMarker)); err != nil {
		return err
	}

	if opts.Verbose {
		fmt.Fprintln(os.Stderr, "Got all done. Cleaning up", client.RunContext.Step)
	}
	return nil
}
