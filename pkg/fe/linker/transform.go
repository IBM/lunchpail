package linker

import (
	"gopkg.in/yaml.v3"
	"lunchpail.io/pkg/fe/linker/yaml/queue"
	"slices"
	"strings"
)

func transformApplications(appname, runname, namespace string, model AppModel, queueSpec queue.Spec, verbose bool) ([]string, error) {
	yamls := []string{}

	for _, r := range model.Applications {
		// until we fully dismantle the controller, we will *also* need to pass through the Application resources
		if bytes, err := yaml.Marshal(r); err != nil {
			return yamls, err
		} else {
			yamls = append(yamls, string(bytes))
		}

		switch r.Spec.Api {
		case WorkqueueApi:
			// currently, we implicitly handle this in the
			// core charts/template/workstealer. perhaps
			// we can move that to be parallel to the
			// other api handlers
			continue
		case ShellApi:
			if tyamls, err := TransformShell(appname, runname, namespace, r, queueSpec, model.RepoSecrets, verbose); err != nil {
				return yamls, err
			} else {
				yamls = slices.Concat(yamls, tyamls)
			}
		}
	}

	return yamls, nil
}

func transformWorkerPools(pools []WorkerPool) ([]string, error) {
	yamls := []string{}

	for _, r := range pools {
		if bytes, err := yaml.Marshal(r); err != nil {
			return yamls, err
		} else {
			yamls = append(yamls, string(bytes))
		}
	}

	return yamls, nil
}

// AppModel -> multi-document yaml string
func transform(appname, runname, namespace string, model AppModel, queueSpec queue.Spec, verbose bool) (string, error) {
	apps, err := transformApplications(appname, runname, namespace, model, queueSpec, verbose)
	if err != nil {
		return "", err
	}

	pools, err := transformWorkerPools(model.WorkerPools)
	if err != nil {
		return "", err
	}

	return strings.Join(
		slices.Concat(apps, pools, model.Others),
		"\n---\n",
	), nil
}
