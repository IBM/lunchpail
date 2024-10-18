package s3

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(buildName, runname string, s3 hlir.ProcessS3Objects, ir llir.LLIR, opts build.Options) (llir.Component, error) {
	app, err := transpile(runname, s3)
	if err != nil {
		return nil, err
	}

	return shell.LowerAsComponent(
		buildName,
		runname,
		app,
		ir,
		llir.ShellComponent{Component: lunchpail.DispatcherComponent},
		opts,
	)
}
