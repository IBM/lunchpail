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
func (backend Backend) Up(octx context.Context, ir llir.LLIR, opts llir.Options) error {
	if err := backend.IsCompatible(ir); err != nil {
		return err
	}

	ir.Queue = ir.Queue.UpdateEndpoint(fmt.Sprintf("localhost:%d", ir.Queue.Port))

	logdir, err := files.LogDir(ir.RunName, true)
	if err != nil {
		return err
	}

	if pidfile, err := files.PidfileForMain(ir.RunName); err != nil {
		return err
	} else {
		shell.WritePid(pidfile, os.Getpid())
	}

	if err := saveQueue(ir); err != nil {
		return err
	}

	group, ctx := errgroup.WithContext(octx)
	for _, c := range ir.Components {
		group.Go(func() error { return backend.spawn(ctx, c, ir.Queue, ir.RunName, logdir, opts.Log.Verbose) })
	}

	return group.Wait()
}
