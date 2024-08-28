package boot

import (
	"fmt"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/fe"
	"lunchpail.io/pkg/observe/status"
)

type UpOptions = fe.CompileOptions

func upDown(backend be.Backend, opts UpOptions, isUp bool) error {
	linked, err := fe.PrepareForRun(backend, opts)
	if err != nil {
		return err
	}

	cliOptions := platform.CliOptions{
		CreateNamespace: linked.Options.CreateNamespace,
		ImagePullSecret: linked.Options.ImagePullSecret,
	}

	if opts.DryRun {
		fmt.Printf(kubernetes.DryRun(linked.Ir, linked.Namespace, cliOptions, opts.Verbose))
		return nil
	} else if isUp {
		if err := backend.Up(linked, cliOptions, opts.Verbose); err != nil {
			return err
		} else if opts.Watch {
			return status.UI(linked.Runname, backend, status.Options{Watch: true, Verbose: opts.Verbose, Summary: false, Nloglines: 500, IntervalSeconds: 5})
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
