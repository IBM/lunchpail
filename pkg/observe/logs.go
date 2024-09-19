package observe

import (
	"context"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/lunchpail"
)

type LogsOptions struct {
	Tail       int
	Follow     bool
	Verbose    bool
	Components []lunchpail.Component
}

func Logs(ctx context.Context, runnameIn string, backend be.Backend, opts LogsOptions) error {
	runname, err := util.WaitForRun(ctx, runnameIn, true, backend)
	if err != nil {
		return err
	}

	if len(opts.Components) == 0 {
		opts.Components = lunchpail.AllUserComponents
	}

	group, _ := errgroup.WithContext(ctx)
	streamer := backend.Streamer(ctx, runname)
	for _, component := range opts.Components {
		group.Go(func() error {
			return streamer.ComponentLogs(component, opts.Tail, opts.Follow, opts.Verbose)
		})
	}

	return group.Wait()
}
