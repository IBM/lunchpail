package transformer

import (
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/fe/transformer/api/workstealer"
	"lunchpail.io/pkg/ir/hlir"
	"slices"
)

// HLIR -> LLIR for []hlir.Application
func lowerApplications(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, opts assembly.Options, verbose bool) ([]string, error) {
	yamls := []string{}

	for _, r := range model.Applications {
		switch {
		case r.Spec.Role == hlir.WorkerRole:
			if tyamls, err := workstealer.Lower(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, opts, verbose); err != nil {
				return yamls, err
			} else {
				yamls = slices.Concat(yamls, tyamls)
			}
		case r.Spec.Api == hlir.ShellApi:
			if tyamls, err := shell.Lower(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, opts, verbose); err != nil {
				return yamls, err
			} else {
				yamls = slices.Concat(yamls, tyamls)
			}
		}
	}

	return yamls, nil
}
