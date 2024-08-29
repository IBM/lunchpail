package local

import (
	"context"
	"fmt"

	"lunchpail.io/pkg/be/local/shell"
	"lunchpail.io/pkg/ir/llir"
)

func spawn(ctx context.Context, c llir.Component, q llir.Queue, runname, logdir string) error {
	switch cc := c.(type) {
	case llir.ShellComponent:
		if cc.RunAsJob {
			return shell.SpawnJob(ctx, cc, q, runname, logdir)
		} else {
			return shell.Spawn(ctx, cc, q, runname, logdir)
		}
	}

	return fmt.Errorf("Unsupported component type")
}
