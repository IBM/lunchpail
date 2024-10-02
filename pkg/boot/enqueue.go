package boot

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/runtime/queue"
)

// Add the given `inputs` to the queue and copy the corresponding
// outputs back as their processing is completed.
func enqueue(ctx context.Context, inputs []string, backend be.Backend, ir llir.LLIR, opts build.LogOptions, isRunning <-chan struct{}, copyoutDone chan<- struct{}, cancel func()) {
	defer func() { copyoutDone <- struct{}{} }()

	// wait for the run to be ready for us to enqueue
	<-isRunning
	client, stop, err := queue.NewS3ClientForRun(ctx, backend, ir.RunName)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		cancel()
	}
	defer stop()

	qopts := queue.AddOptions{
		S3Client:   client,
		LogOptions: opts,
	}
	if err := queue.AddList(ctx, inputs, qopts); err != nil {
		fmt.Fprintln(os.Stderr, err)
		cancel()
	}

	if err := queue.QdoneClient(ctx, client, opts); err != nil {
		fmt.Fprintln(os.Stderr, err)
		cancel()
	}

	// TODO: backend.Wait(ir)? which would be a no-op for local

	// If we aren't piped into anything, then copy out the outbox files
	copyout := true // TODO: util.StdoutIsTty()
	objects, errs := client.Listen(client.Paths.Bucket, client.Outbox(), "")
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
	downloadFile := ""
	downloadNow := func() {
		object := downloadFile
		b := filepath.Base(object)
		inIdx := slices.IndexFunc(inputs, func(in string) bool { return filepath.Base(in) == b })
		dstFolder := "."
		if inIdx >= 0 {
			dstFolder = filepath.Dir(inputs[inIdx])
		}

		ext := filepath.Ext(object)
		withoutExt := object[0 : len(object)-len(ext)]
		dst := filepath.Join(dstFolder, strings.Replace(withoutExt, client.Outbox()+"/", "", 1)+".output"+ext)
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Downloading output to %s\n", dst)
		}
		group.Go(func() error { return client.Download(client.Paths.Bucket, object, dst) })
	}

	for !done {
		select {
		case err := <-errs:
			if strings.Contains(err.Error(), "EOF") {
				done = true
			} else {
				fmt.Fprintln(os.Stderr, err)
			}
		case object := <-objects:
			ext := filepath.Ext(object)
			switch ext {
			case ".code", ".failed", ".stdout", ".stderr":
				// ignore
			case ".succeeded":
				succeeded = true
				if downloadFile != "" {
					downloadNow()
				}
			default:
				switch {
				case copyout:
					downloadFile = object
					if succeeded {
						downloadNow()
					}
				default:
					// Otherwise, report on out stdout references to those outbox files
					fmt.Println(object)
				}
			}
		}
	}

	if err := group.Wait(); err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
	}
}
