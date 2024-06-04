package transformer

import (
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"slices"
)

// HLIR -> LLIR for []hlir.ParameterSweep, ...
func lowerDispatchers(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, verbose bool) ([]string, error) {
	yamls := []string{}

	for _, r := range model.ParameterSweeps {
		if tyamls, err := api.LowerParameterSweep(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, verbose); err != nil {
			return yamls, err
		} else {
			yamls = slices.Concat(yamls, tyamls)
		}
	}

	return yamls, nil
}
