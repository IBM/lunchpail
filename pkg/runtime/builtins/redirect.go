package builtins

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

func RedirectTo(ctx context.Context, client s3.S3Client, run queue.RunContext, folderFor func(object string) string, opts build.LogOptions) error {
	outbox := run.AsFile(queue.AssignedAndFinished)
	outboxObjects, outboxErrs := client.Listen(client.Paths.Bucket, outbox, "", false)

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
					fmt.Fprintf(os.Stderr, "Error downloading output %s\n%v\n", object, err)
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

	for !done {
		select {
		case <-ctx.Done():
			done = true
		case err := <-outboxErrs:
			if err == nil || strings.Contains(err.Error(), "EOF") {
				done = true
			} else {
				fmt.Fprintln(os.Stderr, err)
			}
		case object := <-outboxObjects:
			downloadNow(object)
		}
	}

	if err := group.Wait(); err != nil {
		return err
	}

	return nil
}
