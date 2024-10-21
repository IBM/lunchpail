package dispatch

import (
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/dispatch/parametersweep"
	"lunchpail.io/pkg/fe/transformer/api/dispatch/s3"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
)

// HLIR -> LLIR for []hlir.ParameterSweep, ...
func Lower(buildName string, run queue.RunContext, model hlir.HLIR, ir llir.LLIR, opts build.Options) ([]llir.Component, error) {
	components := []llir.Component{}

	for _, r := range model.ParameterSweeps {
		if component, err := parametersweep.Lower(buildName, run, r, ir, opts); err != nil {
			return components, err
		} else {
			components = append(components, component)
		}
	}

	for _, r := range model.ProcessS3Objects {
		if component, err := s3.Lower(buildName, run, r, ir, opts); err != nil {
			return components, err
		} else {
			components = append(components, component)
		}
	}

	return components, nil
}
