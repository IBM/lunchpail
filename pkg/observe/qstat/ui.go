package qstat

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/bep/debounce"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/observe/queuestreamer"
)

type Options struct {
	queuestreamer.StreamOptions

	// Continue to track the output versus show just a one-time UI
	Follow bool

	// Debounce output with this granularity in milliseconds
	Debounce int
}

func UI(ctx context.Context, runnameIn string, backend be.Backend, opts Options) error {
	run, modelChan, doneChan, group, err := stream(ctx, runnameIn, backend, opts)
	if err != nil {
		return err
	}
	defer close(doneChan)

	r := newRenderer(run)

	// Debounce output to avoid quick flurries of UI output
	dbinterval := opts.Debounce
	if dbinterval == 0 {
		dbinterval = 1000
	}
	debounced := debounce.New(time.Duration(dbinterval) * time.Millisecond)

	// Consume model updates from channel `c` and render them to
	// the console as a table
	for model := range modelChan {
		if opts.Debug {
			fmt.Fprintln(os.Stderr, "Got model update", model)
		}

		if !r.isEmpty(model) {
			debounced(func() {
				t := r.render(model)
				for idx, step := range model.Steps {
					r.step(idx, step, t)
				}
				// fmt.Printf("%s\tWorkers: %d\n", model.Timestamp, model.LiveWorkers())
				fmt.Println(t)
			})
		}

		if !opts.Follow {
			break
		}
	}

	if opts.Debug {
		fmt.Fprintln(os.Stderr, "Stopped receiving updates")
	}
	return group.Wait()
}
