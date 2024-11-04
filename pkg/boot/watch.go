package boot

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe"
	"lunchpail.io/pkg/observe/cpu"
)

type WatchOptions struct {
	Verbose bool
}

func watchLogs(ctx context.Context, backend be.Backend, ir llir.LLIR, logsDone chan<- error, opts WatchOptions) {
	components := lunchpail.AllUserComponents
	if opts.Verbose && os.Getenv("CI") != "" {
		components = lunchpail.AllComponents
	}

	select {
	case <-ctx.Done():
	default:
		logsDone <- observe.Logs(ctx, ir.RunName(), backend, observe.LogsOptions{Follow: true, Verbose: opts.Verbose, Components: components, Writer: os.Stderr})
	}
}

func watchUtilization(ctx context.Context, backend be.Backend, ir llir.LLIR, opts WatchOptions) {
	err := cpu.UI(ctx, ir.RunName(), backend, cpu.CpuOptions{Verbose: opts.Verbose, NoClearScreen: true, IntervalSeconds: 10})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
	}
}
