package observe

import (
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe/colors"
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

	useComponentPrefix := len(opts.Components) > 1

	group, _ := errgroup.WithContext(ctx)
	s := backend.Streamer(ctx, queue.RunContext{RunName: runname})
	for _, component := range opts.Components {
		group.Go(func() error {
			var prefix streamer.LinePrefixFunction
			if useComponentPrefix {
				prefix = LogsComponentPrefix(component)
			}

			return s.ComponentLogs(
				component,
				streamer.LogOptions{
					Tail:       opts.Tail,
					Follow:     opts.Follow,
					Verbose:    opts.Verbose,
					LinePrefix: prefix,
				},
			)
		})
	}

	return group.Wait()
}

func LogsComponentPrefix(component lunchpail.Component) streamer.LinePrefixFunction {
	return func(instanceName string) string {
		return colors.ComponentStyle(component).Render(fmt.Sprintf("%-8s", instanceName))
	}
}
