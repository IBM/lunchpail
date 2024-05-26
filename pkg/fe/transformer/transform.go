package transformer

import (
	"fmt"
	"gopkg.in/yaml.v3"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir"
	"lunchpail.io/pkg/ir/hlir"
	"slices"
)

func transformApplications(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, verbose bool) ([]string, error) {
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

func transformWorkerPools(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, verbose bool) ([]string, error) {
	yamls := []string{}

	app, found := model.GetApplicationByRole(hlir.WorkerRole)
	if !found {
		return []string{}, fmt.Errorf("No Application with role Worker found")
	}

	for _, pool := range model.WorkerPools {
		if tyamls, err := api.LowerWorkerPool(assemblyName, runname, namespace, app, pool, queueSpec, model.RepoSecrets, verbose); err != nil {
			return yamls, err
		} else {
			yamls = slices.Concat(yamls, tyamls)
		}
	}

	return yamls, nil
}

func transformOthers(assemblyName, runname string, model hlir.AppModel) ([]string, error) {
	yamls := []string{}

	for _, r := range model.Others {
		maybemetadata, ok := r["metadata"]
		if ok {
			if metadata, ok := maybemetadata.(hlir.UnknownResource); ok {
				var labels hlir.UnknownResource
				maybelabels, ok := metadata["labels"]
				if !ok || maybelabels == nil {
					labels = hlir.UnknownResource{}
				} else if yeslabels, ok := maybelabels.(hlir.UnknownResource); ok {
					labels = yeslabels
				}

				if labels != nil {
					labels["app.kubernetes.io/part-of"] = assemblyName
					labels["app.kubernetes.io/instance"] = runname
					labels["app.kubernetes.io/managed-by"] = "lunchpail.io"

					metadata["labels"] = labels
					r["metadata"] = metadata
				}
			}
		}

		yaml, err := yaml.Marshal(r)
		if err != nil {
			return []string{}, err
		}
		yamls = append(yamls, string(yaml))
	}

	return yamls, nil
}

// HLIR -> LLIR
func Lower(assemblyName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, verbose bool) (ir.LLIR, error) {
	apps, err := transformApplications(assemblyName, runname, namespace, model, queueSpec, verbose)
	if err != nil {
		return ir.LLIR{}, err
	}

	pools, err := transformWorkerPools(assemblyName, runname, namespace, model, queueSpec, verbose)
	if err != nil {
		return ir.LLIR{}, err
	}

	others, err := transformOthers(assemblyName, runname, model)
	if err != nil {
		return ir.LLIR{}, err
	}

	return ir.LLIR{
		others,
		slices.Concat(apps, pools),
	}, nil
}
