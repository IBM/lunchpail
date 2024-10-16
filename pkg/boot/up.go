//go:build full || manage

package boot

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
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

	return upLLIR(ctx, backend, ir, opts)
}

func UpHLIR(ctx context.Context, backend be.Backend, ir hlir.HLIR, opts UpOptions) error {
	llir, err := fe.PrepareHLIRForRun(ir, "", fe.PrepareOptions{NoDispatchers: len(opts.Inputs) > 0}, opts.BuildOptions)
	if err != nil {
		return err
	}

	return upLLIR(ctx, backend, llir, opts)
}

func upLLIR(ctx context.Context, backend be.Backend, ir llir.LLIR, opts UpOptions) error {
	if opts.DryRun {
		out, err := backend.DryRun(ir, opts.BuildOptions)
		if err != nil {
			return err
		}
		fmt.Printf(out)
		return nil
	}

	pipelineMeta, err := handlePipelineStdin(ir)
	if err != nil {
		return err
	}
	ir.Queue = pipelineMeta.Queue

	if !ir.HasDispatcher() && len(opts.Inputs) == 0 && pipelineMeta.Step == 0 {
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
	isRunning3 := make(chan struct{})
	go func() {
		<-isRunning
		isRunning3 <- struct{}{}
		if len(opts.Inputs) > 0 {
			isRunning3 <- struct{}{}
		}
		if opts.Watch {
			isRunning3 <- struct{}{}
		}
	}()

	copyoutDone := make(chan struct{})
	if len(opts.Inputs) > 0 {
		// Behave like `cat inputs | ... > outputs`
		go func() {
			// wait for the run to be ready for us to enqueue
			<-isRunning3
			defer func() { copyoutDone <- struct{}{} }()

			if err := catAndRedirect(cancellable, opts.Inputs, backend, ir, *opts.BuildOptions.Log); err != nil {
				fmt.Fprintln(os.Stderr, err)
				cancel()
			}
		}()
	}

	if opts.Watch {
		verbose := opts.BuildOptions.Log.Verbose
		go func() {
			<-isRunning3
			go watchLogs(cancellable, backend, ir, WatchOptions{Verbose: verbose})
			go watchUtilization(cancellable, backend, ir, WatchOptions{Verbose: verbose})
		}()
	}

	defer cancel()
	err = backend.Up(cancellable, ir, opts.BuildOptions, isRunning)

	<-isRunning3
	pipelineMeta.Queue = ir.Queue
	if err := handlePipelineStdout(pipelineMeta); err != nil {
		return err
	}

	if len(opts.Inputs) > 0 {
		<-copyoutDone
	}

	return err
}
