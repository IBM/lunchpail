package transformer

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/fe/transformer/api/workstealer"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR for []hlir.Application
func lowerApplications(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, opts assembly.Options, verbose bool) ([]llir.Component, error) {
	components := []llir.Component{}

	for _, r := range model.Applications {
		switch {
		case r.Spec.Role == hlir.WorkerRole:
			if component, err := workstealer.Lower(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, opts, verbose); err != nil {
				return components, err
			} else {
				components = append(components, component)
			}
		default:
			if component, err := shell.Lower(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, opts, verbose); err != nil {
				return components, err
			} else {
				components = append(components, component)
			}
		}
	}

	return components, nil
}
