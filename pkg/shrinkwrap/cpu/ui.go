package cpu

import (
	"fmt"
	"lunchpail.io/pkg/runs"
	"lunchpail.io/pkg/lunchpail"
)

type CpuOptions struct {
	Namespace string
	Watch     bool
	Verbose   bool
	IntervalSeconds int
}

func UI(runnameIn string, opts CpuOptions) error {
	_, runname, namespace, err := runs.WaitForRun(runnameIn, opts.Namespace, opts.Watch)
	if err != nil {
		return err
	}

	c, err := StreamCpu(runname, namespace, opts.IntervalSeconds)
	if err != nil {
		return err
	}

	for model := range c {
		for _, worker := range model.Workers {
			fmt.Printf("%v %s %.2f%%\n", lunchpail.ComponentShortName(worker.Component), worker.Name, worker.CpuUtil)
		}

		if !opts.Watch {
			break
		}
	}

	return nil
}
