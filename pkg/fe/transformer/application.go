package transformer

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/fe/transformer/api/workstealer"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR for []hlir.Application
func lowerApplications(buildName string, ctx llir.Context, model hlir.HLIR, opts build.Options) ([]llir.Component, error) {
	components := []llir.Component{}

	if ctx.Run.Step == 0 && workstealer.IsNeeded(model) {
		// Note, the actual worker resources will be dealt
		// with when a WorkerPool is created. Here, we only
		// need to specify a WorkStealer.
		c, err := workstealer.Lower(buildName, ctx, opts)
		if err != nil {
			return nil, err
		}
		components = append(components, c)
	}

	// Then, for every non-Worker, we lower it as a "shell"
	for app := range model.SupportApplications() {
		c, err := shell.Lower(buildName, ctx, app, opts)
		if err != nil {
			return nil, err
		}
		components = append(components, c)
	}

	return components, nil
}
