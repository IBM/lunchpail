package workstealer

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(compilationName, runname string, ir llir.LLIR, opts compilation.Options, verbose bool) (llir.Component, error) {
	app, err := transpile(runname)
	if err != nil {
		return nil, err
	}

	return shell.LowerAsComponent(
		compilationName,
		runname,
		app,
		ir,
		llir.ShellComponent{Component: lunchpail.WorkStealerComponent},
		opts,
		verbose,
	)
}
