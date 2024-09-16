package local

import (
	"context"
	"fmt"

	"lunchpail.io/pkg/be/local/shell"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) spawn(ctx context.Context, c llir.Component, q llir.Queue, runname, logdir string, verbose bool) error {
	switch cc := c.(type) {
	case llir.ShellComponent:
		if cc.RunAsJob {
			return shell.SpawnJob(ctx, cc, q, runname, logdir, verbose)
		} else {
			return shell.Spawn(ctx, cc, q, runname, logdir, verbose)
		}
	}

	return fmt.Errorf("Unsupported component type")
}
