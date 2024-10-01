//go:build full || manage

package boot

import (
	"context"
	"fmt"
	"os"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe"
	"lunchpail.io/pkg/runtime/queue"
	"lunchpail.io/pkg/util"
)

type UpOptions struct {
	Inputs       []string
	DryRun       bool
	Watch        bool
	BuildOptions build.Options
}

func Up(ctx context.Context, backend be.Backend, opts UpOptions) error {
	ir, err := fe.PrepareForRun("", fe.PrepareOptions{NoDispatchers: len(opts.Inputs) > 0}, opts.BuildOptions)
	if err != nil {
		return err
	}

	if opts.DryRun {
		out, err := backend.DryRun(ir, opts.BuildOptions)
		if err != nil {
			return err
		}
		fmt.Printf(out)
		return nil
	}

	isRunning := make(chan struct{})
	cancellable, cancel := context.WithCancel(ctx)

	if opts.Watch && !util.StdoutIsTty() {
		// if stdout is not a tty, then we can't support
		// watch, no matter what the user asked for
		fmt.Fprintf(os.Stderr, "Warning: disabling watch mode because stdout is not a tty\n")
		opts.Watch = false
	}

	// We need to chain the isRunning channel to our 0-2 consumers
	// below. This is because golang channels are not multicast.
	isRunning2 := make(chan struct{})
	go func() {
		<-isRunning
		if len(opts.Inputs) > 0 {
			isRunning2 <- struct{}{}
		}
		if opts.Watch {
			isRunning2 <- struct{}{}
		}
	}()

	enqueueDone := make(chan struct{})
	if len(opts.Inputs) > 0 {
		go func() {
			<-isRunning2
			client, stop, err := queue.NewS3ClientForRun(ctx, backend, ir.RunName)
			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				cancel()
			}
			defer stop()

			qopts := queue.EnqueueFileOptions{
				S3Client:   client,
				LogOptions: *opts.BuildOptions.Log,
			}
			if err := enqueue(cancellable, backend, opts.Inputs, qopts); err != nil {
				fmt.Fprintln(os.Stderr, err)
				cancel()
			}

			if err := queue.QdoneClient(cancellable, client, *opts.BuildOptions.Log); err != nil {
				fmt.Fprintln(os.Stderr, err)
				cancel()
			}

			enqueueDone <- struct{}{}
		}()
	}

	if opts.Watch {
		verbose := opts.BuildOptions.Log.Verbose
		go func() {
			<-isRunning2
			go watchLogs(cancellable, backend, ir, WatchOptions{Verbose: verbose})
			go watchUtilization(cancellable, backend, ir, WatchOptions{Verbose: verbose})
		}()
	}

	defer cancel()
	err = backend.Up(cancellable, ir, opts.BuildOptions, isRunning)
	if len(opts.Inputs) > 0 {
		// wait till we've enqueued before exiting
		<-enqueueDone
	}
	return err
}

func enqueue(ctx context.Context, backend be.Backend, inputs []string, opts queue.EnqueueFileOptions) error {
	if len(inputs) == 0 {
		return nil
	}

	group, gctx := errgroup.WithContext(ctx)
	for idx, input := range inputs {
		group.Go(func() error {
			opts.AsIfNamedPipe = fmt.Sprintf("task.%d.txt", idx+1)
			if _, err := queue.EnqueueFile(gctx, input, opts); err != nil {
				return err
			}
			return nil
		})
	}

	return group.Wait()
}
