package minio

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(buildName string, ctx llir.Context, model hlir.HLIR, opts build.Options) (llir.Component, error) {
	if !ctx.Queue.Auto {
		return nil, nil
	}

	app, err := transpile(ctx)
	if err != nil {
		return nil, err
	}

	component, err := shell.LowerAsComponent(
		buildName,
		ctx,
		app,
		llir.ShellComponent{Component: lunchpail.MinioComponent},
		opts,
	)

	return component, err
}
