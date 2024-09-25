package workerpool

import (
	"fmt"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR for []hlir.WorkerPool
func LowerAll(buildName, runname string, model hlir.HLIR, ir llir.LLIR, opts build.Options) ([]llir.Component, error) {
	components := []llir.Component{}

	app, found := model.GetApplicationByRole(hlir.WorkerRole)
	if !found {
		return components, fmt.Errorf("No Application with role Worker found")
	}

	for _, pool := range model.WorkerPools {
		if component, err := Lower(buildName, runname, app, pool, ir, opts); err != nil {
			return components, err
		} else {
			components = append(components, component)
		}
	}

	return components, nil
}
