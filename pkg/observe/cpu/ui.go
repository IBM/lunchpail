package cpu

import (
	"fmt"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/observe/colors"
)

type CpuOptions struct {
	Namespace       string
	Verbose         bool
	IntervalSeconds int
}

func UI(runnameIn string, backend be.Backend, opts CpuOptions) error {
	_, runname, err := util.WaitForRun(runnameIn, true, backend)
	if err != nil {
		return err
	}

	c, err := backend.Streamer().Utilization(runname, opts.IntervalSeconds)
	if err != nil {
		return err
	}

	for model := range c {
		if !opts.Verbose {
			fmt.Print("\033[H\033[2J")
		}

		for _, worker := range model.Sorted() {
			util := fmt.Sprintf("%8.2f%%", worker.CpuUtil)
			fmt.Printf("%s %s %s\n", colors.Component(worker.Component), colors.Bold.Render(util), worker.Name)
		}
	}

	return nil
}
