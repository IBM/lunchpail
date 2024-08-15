package s3

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

func Lower(compilationName, runname, namespace string, s3 hlir.ProcessS3Objects, queueSpec queue.Spec, opts compilation.Options, verbose bool) (llir.Component, error) {
	app, err := transpile(s3)
	if err != nil {
		return llir.Component{}, err
	}

	return shell.Lower(
		compilationName,
		runname,
		namespace,
		app,
		queueSpec,
		"", // no service account needed
		opts,
		verbose,
	)
}
