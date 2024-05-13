package status

import (
	"golang.org/x/term"
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
		width, _, err := term.GetSize(1)
		if err != nil {
			return err
		}

		if !opts.Verbose {
			clearScreen(os.Stdout)
		}

		view(model, width, opts.Summary)
	}

	return errgroup.Wait()
}
