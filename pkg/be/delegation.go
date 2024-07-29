package be

import (
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/observe/events"
)

func ChangeWorkers(poolName, poolNamespace string, poolPlatform platform.Platform, context string, delta int) error {
	if poolPlatform == platform.Kubernetes {
		return kubernetes.ChangeWorkers(poolName, poolNamespace, context, delta)
	}
	return nil
}

func StreamRunEvents(appname, runname, namespace string) (chan events.Message, error) {
	return kubernetes.StreamRunEvents(appname, runname, namespace)
}

func StreamRunComponentUpdates(appname, runname, namespace string) (chan events.ComponentUpdate, chan events.Message, error) {
	return kubernetes.StreamRunComponentUpdates(appname, runname, namespace)
}

func Ok(target platform.Platform) error {
	switch target {
	case platform.Kubernetes:
		return kubernetes.Ok()
	}

	return nil
}

func Values(target platform.Platform) ([]string, error) {
	switch target {
	case platform.Kubernetes:
		return kubernetes.Values()
	}

	return []string{}, nil
}
