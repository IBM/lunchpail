package boot

import (
	"context"
	"strings"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

func waitForAllDone(ctx context.Context, backend be.Backend, run queue.RunContext, opts build.LogOptions) error {
	client, err := s3.NewS3ClientForRun(ctx, backend, run.RunName)
	if err != nil {
		if strings.Contains(err.Error(), "Connection closed") {
			// already gone
			return nil
		}
		return err
	}
	run.Bucket = client.RunContext.Bucket
	defer client.Stop()

	alldone := run.AsFile(queue.AllDoneMarker)
	objc, errc := client.Listen(run.Bucket, alldone, "", false)

	for {
		select {
		case <-objc:
			return nil
		case <-ctx.Done():
			return nil
		case err := <-errc:
			if err == nil || strings.Contains(err.Error(), "EOF") || strings.Contains(err.Error(), "connection refused") || strings.Contains(err.Error(), "Connection closed") {
				return nil
			} else {
				return err
			}
		}
	}
}
