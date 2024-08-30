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
	linked, err := fe.PrepareForRun(opts)
	if err != nil {
		return err
	}

	cliOptions := options.CliOptions{
		CreateNamespace: linked.Options.CreateNamespace,
		ImagePullSecret: linked.Options.ImagePullSecret,
	}

	if opts.DryRun {
		fmt.Printf(backend.DryRun(linked.Ir, cliOptions, opts.Verbose))
		return nil
	} else if isUp {
		if err := backend.Up(linked, cliOptions, opts.Verbose); err != nil {
			return err
		} else if opts.Watch {
			return status.UI(linked.Ir.RunName, backend, status.Options{Watch: true, Verbose: opts.Verbose, Summary: false, Nloglines: 500, IntervalSeconds: 5})
		}
	} else if err := backend.Down(linked, cliOptions, opts.Verbose); err != nil {
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
