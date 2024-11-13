package boot

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

func lookForTaskFailures(ctx context.Context, backend be.Backend, run queue.RunContext, opts build.LogOptions) error {
	client, err := s3.NewS3ClientForRun(ctx, backend, run, opts)
	if err != nil {
		return err
	}
	run = client.RunContext
	defer client.Stop()

	if err := client.Mkdirp(run.Bucket); err != nil {
		return err
	}

	failures := run.AsFileForAnyWorker(queue.FinishedWithFailed) // we want to be notified if a task fails in *any* worker
	objc, errc := client.Listen(run.Bucket, failures, "", false)

	done := false
	for !done {
		select {
		case <-ctx.Done():
			done = true
		case err := <-errc:
			if err == nil || strings.Contains(err.Error(), "EOF") || strings.Contains(err.Error(), "connection refused") {
				done = true
			} else if !errors.Is(err, s3.ListenNotSupportedError) {
				fmt.Fprintln(os.Stderr, err)
			}
		case object := <-objc:
			if object == "" {
				continue
			}
			// Oops, a task failed. Fetch the stderr and show it.
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Got indication of task failure for step=%d: '%s'\n", run.Step, object)
			}

			// We need to find the FinishedWithStderr file
			// that corresponds to the given object, which
			// is an AssignedAndFinished file. To do so,
			// we can parse the object to extract the task
			// instance (`ForObjectTask`) and then use
			// that `fortask` to templatize the
			// FinishedWithCode
			forobject, err := run.ForObject(queue.FinishedWithFailed, object)
			if err != nil {
				return err
			}

			errorContent, err := client.Get(run.Bucket, forobject.AsFile(queue.FinishedWithStderr))
			if err != nil {
				return err
			}

			if errorContent == "" {
				errorContent = "A task completed with no error output, but a non-zero exit code"
			}
			return fmt.Errorf("\033[0;31m" + errorContent + "\033[0m\n")
		}
	}

	return nil
}
