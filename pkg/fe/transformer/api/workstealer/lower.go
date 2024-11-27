package workstealer

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(buildName string, ctx llir.Context, opts build.Options) (llir.ShellComponent, error) {
	app, err := transpile(ctx, *opts.Log)
	if err != nil {
		return llir.ShellComponent{}, err
	}

	return shell.LowerAsComponent(
		buildName,
		ctx,
		app,
		llir.ShellComponent{Component: lunchpail.WorkStealerComponent},
		opts,
	)
}
