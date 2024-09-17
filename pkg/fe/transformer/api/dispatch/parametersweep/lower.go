package parametersweep

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(compilationName, runname string, sweep hlir.ParameterSweep, ir llir.LLIR, opts compilation.Options) (llir.Component, error) {
	app, err := transpile(sweep)
	if err != nil {
		return nil, err
	}

	return shell.LowerAsComponent(
		compilationName,
		runname,
		app,
		ir,
		llir.ShellComponent{Component: lunchpail.DispatcherComponent},
		opts,
	)
}
