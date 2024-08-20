package parametersweep

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

func Lower(compilationName, runname, namespace string, sweep hlir.ParameterSweep, spec llir.ShellSpec, opts compilation.Options, verbose bool) (llir.Component, error) {
	app, err := transpile(sweep)
	if err != nil {
		return llir.Component{}, err
	}

	return shell.Lower(
		compilationName,
		runname,
		namespace,
		app,
		spec,
		opts,
		verbose,
	)
}
