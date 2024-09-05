package observe

import (
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/lunchpail"
)

type LogsOptions struct {
	Tail       int
	Follow     bool
	Verbose    bool
	Components []lunchpail.Component
}

func Logs(runnameIn string, backend be.Backend, opts LogsOptions) error {
	runname, err := util.WaitForRun(runnameIn, true, backend)
	if err != nil {
		return err
	}

	group, _ := errgroup.WithContext(context.Background())

	c := make(chan events.Message)
	go func() {
		for msg := range c {
			fmt.Println(msg.Message)
		}
	}()

	for _, component := range opts.Components {
		group.Go(func() error {
			return backend.Streamer().ComponentLogs(runname, component, opts.Tail, opts.Follow, opts.Verbose)
		})
	}

	return group.Wait()
}
