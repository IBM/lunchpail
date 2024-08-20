package workstealer

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(compilationName, runname, namespace string, app hlir.Application, spec llir.ShellSpec, opts compilation.Options, verbose bool) (llir.Component, error) {
	app, err := transpile(runname)
	if err != nil {
		return llir.Component{}, err
	}

	return shell.LowerAsComponent(
		compilationName,
		runname,
		namespace,
		app,
		spec,
		opts,
		verbose,
		lunchpail.WorkStealerComponent,
	)
}
