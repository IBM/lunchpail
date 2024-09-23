//go:build full || manage

package boot

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe"
	"lunchpail.io/pkg/util"
)

type UpOptions struct {
	DryRun             bool
	Watch              bool
	CompilationOptions compilation.Options
}

func Up(ctx context.Context, backend be.Backend, opts UpOptions) error {
	ir, err := fe.PrepareForRun("", opts.CompilationOptions)
	if err != nil {
		return err
	}

	if opts.DryRun {
		fmt.Printf(backend.DryRun(ir, opts.CompilationOptions))
		return nil
	}

	var isRunning chan struct{}
	cancellable, cancel := context.WithCancel(ctx)

	if opts.Watch && !util.StdoutIsTty() {
		// if stdout is not a tty, then we can't support
		// watch, no matter what the user asked for
		fmt.Fprintf(os.Stderr, "Warning: disabling watch mode because stdout is not a tty\n")
		opts.Watch = false
	}

	if opts.Watch {
		isRunning = make(chan struct{})
		verbose := opts.CompilationOptions.Log.Verbose
		go func() {
			<-isRunning
			go watchLogs(cancellable, backend, ir, WatchOptions{Verbose: verbose})
			go watchUtilization(cancellable, backend, ir, WatchOptions{Verbose: verbose})
		}()
	}

	defer cancel()
	return backend.Up(ctx, ir, opts.CompilationOptions, isRunning)
}
