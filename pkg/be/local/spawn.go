package local

import (
	"context"
	"fmt"

	"lunchpail.io/pkg/be/local/shell"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) spawn(ctx context.Context, c llir.Component, ir llir.LLIR, logdir string, opts build.LogOptions) error {
	switch cc := c.(type) {
	case llir.ShellComponent:
		if cc.RunAsJob {
			return shell.SpawnJob(ctx, cc, ir, logdir, opts)
		} else {
			return shell.Spawn(ctx, cc, ir, logdir, 0, opts)
		}
	}

	return fmt.Errorf("Unsupported component type")
}
