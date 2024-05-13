package status

import (
	"lunchpail.io/pkg/runs"
	"os"
)

type Options struct {
	Namespace string
	Watch     bool
	Verbose   bool
	Summary   bool
}

func UI(runnameIn string, opts Options) error {
	appname, runname, namespace, err := runs.WaitForRun(runnameIn, opts.Namespace, opts.Watch)
	if err != nil {
		return err
	}

	c, errgroup, err := StatusStreamer(appname, runname, namespace, opts.Verbose)
	if err != nil {
		return err
	}
	defer close(c)

	clearScreen(os.Stdout)

	for model := range c {
		if !opts.Verbose {
			clearScreen(os.Stdout)
		}
		view(model, opts.Summary)
	}

	return errgroup.Wait()
}
