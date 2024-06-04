package transformer

import (
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"slices"
)

// HLIR -> LLIR
func Lower(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, verbose bool) (llir.LLIR, error) {
	apps, err := lowerApplications(assemblyName, runname, namespace, model, queueSpec, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	dispatchers, err := lowerDispatchers(assemblyName, runname, namespace, model, queueSpec, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	pools, err := lowerWorkerPools(assemblyName, runname, namespace, model, queueSpec, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	others, err := lowerOthers(assemblyName, runname, model)
	if err != nil {
		return llir.LLIR{}, err
	}

	return llir.LLIR{
		CoreYaml: llir.Yaml{Yamls: others, Context: ""},
		AppYaml: slices.Concat(
			[]llir.Yaml{llir.Yaml{Yamls: apps, Context: ""}},
			[]llir.Yaml{llir.Yaml{Yamls: dispatchers, Context: ""}},
			pools,
		),
	}, nil
}
