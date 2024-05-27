package boot

import (
	"fmt"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/fe"
	"lunchpail.io/pkg/observe/status"
)

type UpOptions = fe.CompileOptions

func Up(opts UpOptions) error {
	if linked, err := fe.Compile(opts); err != nil {
		return err
	} else if opts.DryRun {
		fmt.Printf(linked.Ir.Yaml())
	} else {
		if err := kubernetes.Apply(linked.Ir, linked.Namespace); err != nil {
			return err
		} else if opts.Watch {
			return status.UI(linked.Runname, status.Options{Namespace: linked.Namespace, Watch: true, Verbose: opts.Verbose, Summary: false, Nloglines: 500, IntervalSeconds: 5})
		}
	}

	return nil
}
