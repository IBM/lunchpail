package s3

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

func Lower(assemblyName, runname, namespace string, s3 hlir.ProcessS3Objects, queueSpec queue.Spec, repoSecrets []hlir.RepoSecret, opts assembly.Options, verbose bool) (llir.Yaml, error) {
	app, err := transpile(s3)
	if err != nil {
		return llir.Yaml{}, err
	}

	return shell.Lower(
		assemblyName,
		runname,
		namespace,
		app,
		queueSpec,
		repoSecrets,
		opts,
		verbose,
	)
}
