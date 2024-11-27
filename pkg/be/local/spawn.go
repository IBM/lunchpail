package local

import (
	"context"

	"lunchpail.io/pkg/be/local/shell"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/llir"
)

func (backend Backend) spawn(ctx context.Context, c llir.ShellComponent, ir llir.LLIR, logdir string, opts build.LogOptions) error {
	if c.RunAsJob {
		return shell.SpawnJob(ctx, c, ir, logdir, opts)
	} else {
		return shell.Spawn(ctx, c, ir, logdir, opts)
	}
}
