//go:build full || manage

package boot

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/fe"
	"lunchpail.io/pkg/observe/status"
	"lunchpail.io/pkg/util"
)

type UpOptions = fe.CompileOptions

func upDown(ctx context.Context, backend be.Backend, opts UpOptions, isUp bool) error {
	ir, copts, err := fe.PrepareForRun(opts)
	if err != nil {
		return err
	}

	if opts.Watch && !util.StdoutIsTty() {
		// if stdout is not a tty, then we can't support
		// watch, no matter what the user asked for
		fmt.Fprintf(os.Stderr, "Warning: disabling watch mode because stdout is not a tty\n")
		opts.Watch = false
	}

	if opts.DryRun {
		fmt.Printf(backend.DryRun(ir, copts))
		return nil
	} else if isUp {
		if err := backend.Up(ctx, ir, copts); err != nil {
			return err
		} else if opts.Watch {
			return status.UI(ctx, ir.RunName, backend, status.Options{Watch: true, Verbose: opts.CompilationOptions.Log.Verbose, Summary: false, Nloglines: 500, IntervalSeconds: 5})
		}
	} else if err := backend.Down(ctx, ir, copts); err != nil {
		return err
	}

	return nil
}

func Up(ctx context.Context, backend be.Backend, opts UpOptions) error {
	if err := upDown(ctx, backend, opts, true); err != nil {
		return err
	}

	return nil
}
