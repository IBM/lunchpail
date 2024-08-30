//go:build full || manage

package boot

import (
	"fmt"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/fe"
	"lunchpail.io/pkg/observe/status"
)

type UpOptions = fe.CompileOptions

func upDown(backend be.Backend, opts UpOptions, isUp bool) error {
	ir, copts, err := fe.PrepareForRun(opts)
	if err != nil {
		return err
	}

	cliOpts := options.CliOptions{
		CreateNamespace: copts.CreateNamespace,
		ImagePullSecret: copts.ImagePullSecret,
	}

	if opts.DryRun {
		fmt.Printf(backend.DryRun(ir, cliOpts, opts.Verbose))
		return nil
	} else if isUp {
		if err := backend.Up(ir, copts, cliOpts, opts.Verbose); err != nil {
			return err
		} else if opts.Watch {
			return status.UI(ir.RunName, backend, status.Options{Watch: true, Verbose: opts.Verbose, Summary: false, Nloglines: 500, IntervalSeconds: 5})
		}
	} else if err := backend.Down(ir, copts, cliOpts, opts.Verbose); err != nil {
		return err
	}

	return nil
}

func Up(backend be.Backend, opts UpOptions) error {
	if err := upDown(backend, opts, true); err != nil {
		return err
	}

	return nil
}
