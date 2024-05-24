package linker

import (
	"fmt"
	"lunchpail.io/pkg/fe/linker/yaml/queue"
	"slices"
	"strings"
)

func transformApplications(runname, namespace string, model AppModel, queueSpec queue.Spec, verbose bool) ([]string, error) {
	yamls := []string{}

	for _, r := range model.Applications {
		switch r.Spec.Api {
		case WorkqueueApi:
			// TODO: We implicitly handle this in
			// charts/template/workstealer. Perhaps we can
			// move that to be parallel to the other api
			// handlers.
			continue
		case ShellApi:
			if tyamls, err := TransformShell(runname, namespace, r, queueSpec, model.RepoSecrets, verbose); err != nil {
				return yamls, err
			} else {
				yamls = slices.Concat(yamls, tyamls)
			}
		}
	}

	return yamls, nil
}

func transformWorkerPools(runname, namespace string, model AppModel, queueSpec queue.Spec, verbose bool) ([]string, error) {
	yamls := []string{}

	app, found := model.getApplicationByRole(WorkerRole)
	if !found {
		return []string{}, fmt.Errorf("No Application with role Worker found")
	}
	
	for _, pool := range model.WorkerPools {
		if tyamls, err := TransformWorkerPool(runname, namespace, app, pool, queueSpec, model.RepoSecrets, verbose); err != nil {
			return yamls, err
		} else {
			yamls = slices.Concat(yamls, tyamls)
		}
	}

	return yamls, nil
}

// AppModel -> multi-document yaml string
func transform(appname, runname, namespace string, model AppModel, queueSpec queue.Spec, verbose bool) (string, error) {
	apps, err := transformApplications(runname, namespace, model, queueSpec, verbose)
	if err != nil {
		return "", err
	}

	pools, err := transformWorkerPools(runname, namespace, model, queueSpec, verbose)
	if err != nil {
		return "", err
	}

	return strings.Join(
		slices.Concat(apps, pools, model.Others),
		"\n---\n",
	), nil
}
