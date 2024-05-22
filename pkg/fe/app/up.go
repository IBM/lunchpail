package app

import (
	"fmt"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/observe/status"
)

type UpOptions = linker.LinkOptions

func Up(opts UpOptions) error {
	if linked, err := linker.Link(opts); err != nil {
		return err
	} else if opts.DryRun {
		fmt.Printf(linked.Yaml)
	} else {
		if err := kubernetes.Apply(linked.Yaml, linked.Namespace); err != nil {
			return err
		} else if opts.Watch {
			return status.UI(linked.Runname, status.Options{linked.Namespace, true, opts.Verbose, false, 500, 5})
		}
	}

	return nil
}
