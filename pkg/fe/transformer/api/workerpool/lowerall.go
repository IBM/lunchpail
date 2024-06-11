package workerpool

import (
	"fmt"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"slices"
)

// HLIR -> LLIR for []hlir.WorkerPool
func LowerAll(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, opts assembly.Options, verbose bool) ([]llir.Yaml, error) {
	yamls := []llir.Yaml{}

	app, found := model.GetApplicationByRole(hlir.WorkerRole)
	if !found {
		return yamls, fmt.Errorf("No Application with role Worker found")
	}

	for _, pool := range model.WorkerPools {
		if tyamls, err := Lower(assemblyName, runname, namespace, app, pool, queueSpec, model.RepoSecrets, opts, verbose); err != nil {
			return yamls, err
		} else {
			yamls = slices.Concat(yamls, tyamls)
		}
	}

	return yamls, nil
}
