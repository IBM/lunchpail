package minio

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(compilationName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, opts compilation.Options, verbose bool) (llir.Component, error) {
	app, err := transpile(runname, queueSpec)
	if err != nil {
		return llir.Component{}, err
	}

	component, err := shell.LowerAsComponent(
		compilationName,
		runname,
		namespace,
		app,
		queueSpec,
		"", // no service account needed
		opts,
		verbose,
		lunchpail.MinioComponent,
	)

	return component, err
}
