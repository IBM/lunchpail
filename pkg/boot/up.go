package boot

import (
	"fmt"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/fe"
	"lunchpail.io/pkg/observe/status"
)

type UpOptions = fe.CompileOptions

func upDown(backend be.Backend, opts UpOptions, isUp bool) error {
	linked, err := fe.Compile(backend, opts)

	if err != nil {
		return err
	} else if opts.DryRun {
		fmt.Printf(kubernetes.Marshal(linked.Ir, opts.Verbose))
		return nil
	}

	if isUp {
		if err := backend.Up(linked, opts.Verbose); err != nil {
			return nil
		} else if opts.Watch {
			return status.UI(linked.Runname, backend, status.Options{Namespace: linked.Namespace, Watch: true, Verbose: opts.Verbose, Summary: false, Nloglines: 500, IntervalSeconds: 5})
		}
	} else if err := backend.Down(linked, opts.Verbose); err != nil {
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
