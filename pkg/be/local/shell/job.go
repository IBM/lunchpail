package shell

import (
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/ir/llir"
)

// Run the component as a "job", with multiple workers
func SpawnJob(ctx context.Context, c llir.ShellComponent, q llir.Queue, runname, logdir string, verbose bool) error {
	if c.Sizing.Workers < 1 {
		return fmt.Errorf("Invalid worker count for %v: %d", c, c.Sizing.Workers)
	}

	group, jobCtx := errgroup.WithContext(ctx)

	for workerIdx := range c.Sizing.Workers {
		group.Go(func() error {
			return Spawn(jobCtx, c.WithInstanceNameSuffix(fmt.Sprintf("-w%d", workerIdx)), q, runname, logdir, verbose)
		})
	}

	return group.Wait()
}
