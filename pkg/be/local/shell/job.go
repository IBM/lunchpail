package shell

import (
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/llir"
)

// Run the component as a "job", with multiple workers
func SpawnJob(ctx context.Context, c llir.ShellComponent, ir llir.LLIR, opts build.LogOptions) error {
	if c.InitialWorkers < 1 {
		return fmt.Errorf("Invalid worker count %d for %v", c.InitialWorkers, c.C())
	}
	group, jobCtx := errgroup.WithContext(ctx)

	for workerIdx := range c.InitialWorkers {
		group.Go(func() error {
			return Spawn(jobCtx, c.WithInstanceName(fmt.Sprintf("w%d", workerIdx)), ir, opts)
		})
	}

	return group.Wait()
}
