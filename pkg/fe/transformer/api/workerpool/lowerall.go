package workerpool

import (
	"fmt"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR for []hlir.WorkerPool
func LowerAll(compilationName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, serviceAccount string, opts compilation.Options, verbose bool) ([]llir.Component, error) {
	components := []llir.Component{}

	app, found := model.GetApplicationByRole(hlir.WorkerRole)
	if !found {
		return components, fmt.Errorf("No Application with role Worker found")
	}

	for _, pool := range model.WorkerPools {
		if component, err := Lower(compilationName, runname, namespace, app, pool, queueSpec, serviceAccount, opts, verbose); err != nil {
			return components, err
		} else {
			components = append(components, component)
		}
	}

	return components, nil
}
