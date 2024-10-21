package workstealer

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(buildName string, run queue.RunContext, ir llir.LLIR, opts build.Options) (llir.Component, error) {
	app, err := transpile(run, ir, *opts.Log)
	if err != nil {
		return nil, err
	}

	return shell.LowerAsComponent(
		buildName,
		run,
		app,
		ir,
		llir.ShellComponent{Component: lunchpail.WorkStealerComponent},
		opts,
	)
}
