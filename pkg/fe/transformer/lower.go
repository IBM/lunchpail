package transformer

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/dispatch"
	"lunchpail.io/pkg/fe/transformer/api/workerpool"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"slices"
)

// HLIR -> LLIR
func Lower(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, opts assembly.Options, verbose bool) (llir.LLIR, error) {
	apps, err := lowerApplications(assemblyName, runname, namespace, model, queueSpec, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	dispatchers, err := dispatch.Lower(assemblyName, runname, namespace, model, queueSpec, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	pools, err := workerpool.LowerAll(assemblyName, runname, namespace, model, queueSpec, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	globals, err := lowerGlobals(assemblyName, runname, model)
	if err != nil {
		return llir.LLIR{}, err
	}

	return llir.LLIR{
		GlobalConfig: globals,
		Components:   slices.Concat(apps, dispatchers, pools),
	}, nil
}
