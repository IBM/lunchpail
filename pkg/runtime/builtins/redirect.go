package builtins

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/runtime/queue"
)

func RedirectTo(ctx context.Context, client queue.S3Client, folderFor func(object string) string, opts build.LogOptions) error {
	objects, errs := client.Listen(client.Paths.Bucket, client.Outbox(), "", false)
	group, _ := errgroup.WithContext(ctx)
	done := false

	// A bit of complexity here: we only want to download the file
	// if the task succeeded. But, there is no defined order of
	// arrival of the .succeeded file (from which we can infer
	// that the task processing succeeded) and the actual output
	// file (the one we want to download). So... we keep track of
	// whether we got the .succeeded file, and which file we want
	// to download in these two variables. Then, if we get a
	// .succeeded file and already have receipt of the existence
	// of the file to download... downloadNow! Or, if we already
	// have receipt of success and were notified that the output
	// file (the one to be downloaded) exists, then downloadNow!
	succeeded := false
	failed := false
	stderr := ""
	downloadFile := ""
	downloadNow := func(object string) {
		dstFolder := folderFor(filepath.Base(object))

		ext := filepath.Ext(object)
		withoutExt := object[0 : len(object)-len(ext)]
		dst := filepath.Join(dstFolder, strings.Replace(withoutExt, client.Outbox()+"/", "", 1)+".output"+ext)
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Downloading output to %s\n", dst)
		}
		group.Go(func() error {
			if err := client.Download(client.Paths.Bucket, object, dst); err != nil {
				return err
			}
			return client.MarkConsumed(object)
		})
	}

	for !done {
		select {
		case err := <-errs:
			if err == nil || strings.Contains(err.Error(), "EOF") {
				done = true
			} else {
				fmt.Fprintln(os.Stderr, err)
			}
		case object := <-objects:
			ext := filepath.Ext(object)
			switch ext {
			case ".code", ".stdout":
				// ignore
			case ".stderr":
				stderr = object
				if failed {
					done = true
				}
			case ".failed":
				failed = true
				if stderr != "" {
					done = true
				}
			case ".succeeded":
				succeeded = true
				if downloadFile != "" {
					downloadNow(downloadFile)
				}
			default:
				downloadFile = object
				if succeeded {
					downloadNow(downloadFile)
				}
			}
		}
	}

	if err := group.Wait(); err != nil {
		return err
	} else if failed && stderr != "" {
		errorContent, err := client.Get(client.Paths.Bucket, stderr)
		if err != nil {
			return err
		}
		return fmt.Errorf("Task failed %d %s\n%s", len(errorContent), stderr, errorContent)
	}

	return nil
}
