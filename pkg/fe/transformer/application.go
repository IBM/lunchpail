package transformer

import (
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"slices"
)

// HLIR -> LLIR for []hlir.Application
func lowerApplications(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, verbose bool) ([]string, error) {
	yamls := []string{}

	for _, r := range model.Applications {
		switch r.Spec.Api {
		case hlir.WorkqueueApi:
			// TODO: We implicitly handle this in
			// charts/template/workstealer. Perhaps we can
			// move that to be parallel to the other api
			// handlers.
			continue
		case hlir.ShellApi:
			if tyamls, err := api.LowerShell(assemblyName, runname, namespace, r, queueSpec, model.RepoSecrets, verbose); err != nil {
				return yamls, err
			} else {
				yamls = slices.Concat(yamls, tyamls)
			}
		}
	}

	return yamls, nil
}
