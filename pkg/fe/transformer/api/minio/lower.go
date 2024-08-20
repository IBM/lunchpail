package minio

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(compilationName, runname, namespace string, model hlir.AppModel, spec llir.ShellSpec, opts compilation.Options, verbose bool) (llir.Component, error) {
	app, err := transpile(runname, spec)
	if err != nil {
		return llir.Component{}, err
	}

	component, err := shell.LowerAsComponent(
		compilationName,
		runname,
		namespace,
		app,
		spec,
		opts,
		verbose,
		lunchpail.MinioComponent,
	)

	return component, err
}
