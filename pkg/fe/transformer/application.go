package transformer

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/fe/transformer/api/workstealer"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR for []hlir.Application
func lowerApplications(compilationName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, serviceAccount string, opts compilation.Options, verbose bool) ([]llir.Component, error) {
	components := []llir.Component{}

	for _, r := range model.Applications {
		switch {
		case r.Spec.Role == hlir.WorkerRole:
			if component, err := workstealer.Lower(compilationName, runname, namespace, r, queueSpec, opts, verbose); err != nil {
				return components, err
			} else {
				components = append(components, component)
			}
		default:
			if component, err := shell.Lower(compilationName, runname, namespace, r, queueSpec, serviceAccount, opts, verbose); err != nil {
				return components, err
			} else {
				components = append(components, component)
			}
		}
	}

	return components, nil
}
