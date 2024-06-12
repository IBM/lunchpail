package dispatch

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/dispatch/parametersweep"
	"lunchpail.io/pkg/fe/transformer/api/dispatch/s3"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR for []hlir.ParameterSweep, ...
func Lower(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, opts assembly.Options, verbose bool) ([]llir.Yaml, error) {
	yamls := []llir.Yaml{}

	for _, r := range model.ParameterSweeps {
		if tyaml, err := parametersweep.Lower(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, opts, verbose); err != nil {
			return yamls, err
		} else {
			yamls = append(yamls, tyaml)
		}
	}

	for _, r := range model.ProcessS3Objects {
		if tyaml, err := s3.Lower(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, opts, verbose); err != nil {
			return yamls, err
		} else {
			yamls = append(yamls, tyaml)
		}
	}

	return yamls, nil
}
