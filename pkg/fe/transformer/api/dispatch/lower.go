package dispatch

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api/dispatch/parametersweep"
	"lunchpail.io/pkg/fe/transformer/api/dispatch/s3"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR for []hlir.ParameterSweep, ...
func Lower(compilationName, runname, namespace string, model hlir.AppModel, ir llir.LLIR, opts compilation.Options, verbose bool) ([]llir.Component, error) {
	components := []llir.Component{}

	for _, r := range model.ParameterSweeps {
		if component, err := parametersweep.Lower(compilationName, runname, namespace, r, ir, opts, verbose); err != nil {
			return components, err
		} else {
			components = append(components, component)
		}
	}

	for _, r := range model.ProcessS3Objects {
		if component, err := s3.Lower(compilationName, runname, namespace, r, ir, opts, verbose); err != nil {
			return components, err
		} else {
			components = append(components, component)
		}
	}

	return components, nil
}
