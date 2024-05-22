package linker

import (
	"gopkg.in/yaml.v3"
	"slices"
	"strings"
)

func transformApplications(applications []Application) ([]string, error) {
	yamls := []string{}

	for _, r := range applications {
		if bytes, err := yaml.Marshal(r); err != nil {
			return yamls, err
		} else {
			yamls = append(yamls, string(bytes))
		}
	}

	return yamls, nil
}

func transformWorkDispatchers(dispatchers []WorkDispatcher) ([]string, error) {
	yamls := []string{}

	for _, r := range dispatchers {
		if bytes, err := yaml.Marshal(r); err != nil {
			return yamls, err
		} else {
			yamls = append(yamls, string(bytes))
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
func transform(runname, namespace string, model AppModel) (string, error) {
	apps, err := transformApplications(model.Applications)
	if err != nil {
		return "", err
	}

	disps, err := transformWorkDispatchers(model.WorkDispatchers)
	if err != nil {
		return "", err
	}

	pools, err := transformWorkerPools(model.WorkerPools)
	if err != nil {
		return "", err
	}

	return strings.Join(
		slices.Concat(apps, disps, pools, model.Others),
		"\n---\n",
	), nil
}
