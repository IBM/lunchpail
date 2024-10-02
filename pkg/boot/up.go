//go:build full || manage

package boot

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe"
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

	if !ir.HasDispatcher() && len(opts.Inputs) == 0 {
		return fmt.Errorf("please provide input files on the command line")
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

	copyoutDone := make(chan struct{})
	if len(opts.Inputs) > 0 {
		go enqueue(cancellable, opts.Inputs, backend, ir, *opts.BuildOptions.Log, isRunning2, copyoutDone, cancel)
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
		<-copyoutDone
	}

	return err
}
