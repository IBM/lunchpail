package transformer

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/fe/transformer/api/workstealer"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
)

// HLIR -> LLIR for []hlir.Application
func lowerApplications(buildName string, run queue.RunContext, model hlir.HLIR, ir llir.LLIR, opts build.Options) ([]llir.Component, error) {
	components := []llir.Component{}

	if workstealer.IsNeeded(model) {
		// Note, the actual worker resources will be dealt
		// with when a WorkerPool is created. Here, we only
		// need to specify a WorkStealer.
		c, err := workstealer.Lower(buildName, run, ir, opts)
		if err != nil {
			return nil, err
		}
		components = append(components, c)
	}

	// Then, for every non-Worker, we lower it as a "shell"
	for _, app := range model.Applications {
		if app.Spec.Role != hlir.WorkerRole {
			c, err := shell.Lower(buildName, run, app, ir, opts)
			if err != nil {
				return nil, err
			}
			components = append(components, c)
		}
	}

	return components, nil
}
