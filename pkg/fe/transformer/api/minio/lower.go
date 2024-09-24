package minio

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(compilationName, runname string, model hlir.HLIR, ir llir.LLIR, opts compilation.Options) (llir.Component, error) {
	if !ir.Queue.Auto {
		return nil, nil
	}

	app, err := transpile(runname, ir)
	if err != nil {
		return nil, err
	}

	component, err := shell.LowerAsComponent(
		compilationName,
		runname,
		app,
		ir,
		llir.ShellComponent{Component: lunchpail.MinioComponent},
		opts,
	)

	return component, err
}
