package cpu

import (
	"fmt"
	"sort"
	"lunchpail.io/pkg/runs"
	"lunchpail.io/pkg/views"
)

type CpuOptions struct {
	Namespace string
	Verbose   bool
	IntervalSeconds int
}

func UI(runnameIn string, opts CpuOptions) error {
	_, runname, namespace, err := runs.WaitForRun(runnameIn, opts.Namespace, true)
	if err != nil {
		return err
	}

	c, err := StreamCpu(runname, namespace, opts.IntervalSeconds)
	if err != nil {
		return err
	}

	for model := range c {
		if !opts.Verbose {
			fmt.Print("\033[H\033[2J")
		}

		// TODO: is this copy step necessary? can we just sort
		// the given model.Workers? do we already have a copy?
		w := []Worker{}
		for _, worker := range model.Workers {
			w = append(w, worker)
		}

		sort.Slice(w, func(i, j int) bool { return w[i].CpuUtil > w[j].CpuUtil })

		for _, worker := range w {
			util := fmt.Sprintf("%6.2f%%", worker.CpuUtil)
			fmt.Printf("%-8v %s %s\n", views.Component(worker.Component), views.Bold.Render(util), worker.Name)
		}
	}

	return nil
}
