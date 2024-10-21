package parametersweep

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(buildName string, ctx llir.Context, sweep hlir.ParameterSweep, opts build.Options) (llir.Component, error) {
	app, err := transpile(sweep)
	if err != nil {
		return nil, err
	}

	return shell.LowerAsComponent(
		buildName,
		ctx,
		app,
		llir.ShellComponent{Component: lunchpail.DispatcherComponent},
		opts,
	)
}
