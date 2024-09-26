package local

import (
	"context"
	"fmt"
	"os"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/be/local/shell"
	"lunchpail.io/pkg/ir/llir"
)

// Bring up the linked application
func (backend Backend) Up(octx context.Context, ir llir.LLIR, opts llir.Options, isRunning chan struct{}) error {
	// Fail fast if this backend doesn't support the given IR
	if err := backend.IsCompatible(ir); err != nil {
		return err
	}

	if ir.Queue.Auto {
		ir.Queue = ir.Queue.UpdateEndpoint(fmt.Sprintf("localhost:%d", ir.Queue.Port))
	}

	// This is where component logs will go
	logdir, err := files.LogDir(ir.RunName, true)
	if err != nil {
		return err
	}

	// Write a pid file to indicate the pid of this process
	if pidfile, err := files.PidfileForMain(ir.RunName); err != nil {
		return err
	} else {
		shell.WritePid(pidfile, os.Getpid())
	}

	// Write a breadcrumb that describes the queue this run is using
	if err := saveQueue(ir); err != nil {
		return err
	}

	// Launch each of the components
	group, ctx := errgroup.WithContext(octx)
	for _, c := range ir.Components {
		group.Go(func() error { return backend.spawn(ctx, c, ir.Queue, ir.RunName, logdir, opts.Log.Verbose) })
	}

	// Indicate that we are off to the races
	if isRunning != nil {
		isRunning <- struct{}{}
	}

	// Wait for all of the components to finish
	return group.Wait()
}
