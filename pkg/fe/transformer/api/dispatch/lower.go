package dispatch

import (
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/dispatch/parametersweep"
	"lunchpail.io/pkg/fe/transformer/api/dispatch/s3"
	"lunchpail.io/pkg/ir/hlir"
	"slices"
)

// HLIR -> LLIR for []hlir.ParameterSweep, ...
func Lower(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, verbose bool) ([]string, error) {
	yamls := []string{}

	for _, r := range model.ParameterSweeps {
		if tyamls, err := parametersweep.Lower(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, verbose); err != nil {
			return yamls, err
		} else {
			yamls = slices.Concat(yamls, tyamls)
		}
	}

	for _, r := range model.ProcessS3Objects {
		if tyamls, err := s3.Lower(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, verbose); err != nil {
			return yamls, err
		} else {
			yamls = slices.Concat(yamls, tyamls)
		}
	}

	return yamls, nil
}
