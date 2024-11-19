package workerpool

import (
	"fmt"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR for []hlir.WorkerPool
func LowerAll(buildName string, ctx llir.Context, model hlir.HLIR, opts build.Options) ([]llir.Component, error) {
	components := []llir.Component{}

	app, found := model.GetWorkerApplication()
	if !found {
		return components, fmt.Errorf("No Application with role Worker found")
	}

	if len(model.WorkerPools) == 0 && opts.Workers != -1 {
		// Then add a workerpool
		model.WorkerPools = append(model.WorkerPools, hlir.NewPool("p1", opts.Workers))
	}

	for _, pool := range model.WorkerPools {
		if component, err := Lower(buildName, ctx, app, pool, opts); err != nil {
			return components, err
		} else {
			components = append(components, component)
		}
	}

	return components, nil
}
