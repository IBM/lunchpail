package builtins

import (
	"context"
	"errors"
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
	outboxObjects, outboxErrs := client.Listen(run.Bucket, outbox, "", false)

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Redirect listening on bucket=%s path=%s\n", run.Bucket, outbox)
	}

	group, _ := errgroup.WithContext(ctx)
	done := false

	downloadNow := func(object string) {
		group.Go(func() error {
			dstFolder := folderFor(filepath.Base(object))
			dst := filepath.Join(dstFolder, filepath.Base(object))
			if _, err := os.Stat(dst); err == nil {
				// Then a file with this name already exists. Refuse to overwrite (TODO: allow user to specify they want us to overwrite input files?)
				ext := filepath.Ext(object)
				withoutExt := object[0 : len(object)-len(ext)]
				dst2 := filepath.Join(dstFolder, strings.Replace(withoutExt, outbox+"/", "", 1)+".output"+ext)
				fmt.Fprintf(os.Stderr, "Refusing to overwrite existing file %s. Using %s instead.", dst, dst2)
				dst = dst2
			}
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Downloading output %s to %s\n", object, dst)
			}
			if err := client.Download(run.Bucket, object, dst); err != nil {
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
			} else if !errors.Is(err, s3.ListenNotSupportedError) {
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
