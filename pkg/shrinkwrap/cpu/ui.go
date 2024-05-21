package cpu

import (
	"fmt"
	"lunchpail.io/pkg/shrinkwrap/runs"
	"lunchpail.io/pkg/views"
)

type CpuOptions struct {
	Namespace       string
	Verbose         bool
	IntervalSeconds int
}

func UI(runnameIn string, opts CpuOptions) error {
	_, runname, namespace, err := runs.WaitForRun(runnameIn, opts.Namespace, true)
	if err != nil {
		return err
	}

	c, err := CpuStreamer(runname, namespace, opts.IntervalSeconds)
	if err != nil {
		return err
	}

	for model := range c {
		if !opts.Verbose {
			fmt.Print("\033[H\033[2J")
		}

		for _, worker := range model.Sorted() {
			util := fmt.Sprintf("%8.2f%%", worker.CpuUtil)
			fmt.Printf("%s %s %s\n", views.Component(worker.Component), views.Bold.Render(util), worker.Name)
		}
	}

	return nil
}
