package builtins

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/dustin/go-humanize/english"
	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

func RedirectTo(ctx context.Context, client s3.S3Client, run queue.RunContext, folderFor func(object string) string, opts build.LogOptions) error {
	outbox := run.AsFile(queue.AssignedAndFinished)
	failures := run.AsFileForAnyWorker(queue.FinishedWithFailed) // we want to be notified if a task fails in *any* worker

	outboxObjects, outboxErrs := client.Listen(client.Paths.Bucket, outbox, "", false)
	failuresObjects, failuresErrs := client.Listen(client.Paths.Bucket, failures, "", false)

	group, _ := errgroup.WithContext(ctx)
	done := false

	downloadNow := func(object string) {
		dstFolder := folderFor(filepath.Base(object))

		ext := filepath.Ext(object)
		withoutExt := object[0 : len(object)-len(ext)]
		dst := filepath.Join(dstFolder, strings.Replace(withoutExt, outbox+"/", "", 1)+".output"+ext)
		group.Go(func() error {
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Downloading output to %s\n", dst)
			}
			if err := client.Download(client.Paths.Bucket, object, dst); err != nil {
				if opts.Verbose {
					fmt.Fprintf(os.Stderr, "Error Downloading output %s\n%v\n", object, err)
				}
				return err
			}
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Marking output consumed %s\n", object)
			}
			if err := client.Rm(run.Bucket, object); err != nil {
				return err
			}
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Downloading output done %s\n", object)
			}
			return nil
		})
	}

	nFailures := 0
	for !done {
		select {
		case err := <-outboxErrs:
			if err == nil || strings.Contains(err.Error(), "EOF") {
				done = true
			} else {
				fmt.Fprintln(os.Stderr, err)
			}
		case err := <-failuresErrs:
			if err == nil || strings.Contains(err.Error(), "EOF") {
				done = true
			} else {
				fmt.Fprintln(os.Stderr, err)
			}
		case object := <-outboxObjects:
			downloadNow(object)
		case object := <-failuresObjects:
			// Oops, a task failed. Fetch the stderr and show it.
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Got indication of task failure %s\n", object)
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
			fmt.Fprintf(os.Stderr, "\033[0;31m"+errorContent+"\033[0m")
			nFailures++
		}
	}

	if err := group.Wait(); err != nil {
		return err
	}

	if nFailures > 0 {
		return fmt.Errorf("Error: %s failed", english.PluralWord(nFailures, "task", ""))
	}

	return nil
}
