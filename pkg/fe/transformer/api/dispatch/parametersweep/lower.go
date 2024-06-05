package parametersweep

import (
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
)

func Lower(assemblyName, runname, namespace string, sweep hlir.ParameterSweep, queueSpec queue.Spec, repoSecrets []hlir.RepoSecret, verbose bool) ([]string, error) {
	app, err := transpile(sweep)
	if err != nil {
		return []string{}, err
	}

	return shell.Lower(
		assemblyName,
		runname,
		namespace,
		app,
		queueSpec,
		repoSecrets,
		verbose,
	)
}
