package parametersweep

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

func Lower(assemblyName, runname, namespace string, sweep hlir.ParameterSweep, queueSpec queue.Spec, repoSecrets []hlir.RepoSecret, opts assembly.Options, verbose bool) (llir.Yaml, error) {
	app, err := transpile(sweep)
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
