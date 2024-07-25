package events

import (
	watch "k8s.io/apimachinery/pkg/watch"
	"lunchpail.io/pkg/be/platform"
)

type ComponentUpdate struct {
	Component Component
	Status    WorkerStatus
	Type      watch.EventType

	Name      string
	Namespace string
	Pool      string
	Platform  platform.Platform
}

func DispatcherUpdate(namespace string, platform platform.Platform, status WorkerStatus, event watch.EventType) ComponentUpdate {
	name := ComponentShortName(DispatcherComponent)
	return ComponentUpdate{DispatcherComponent, status, event, name, namespace, "", platform}
}

func WorkStealerUpdate(namespace string, platform platform.Platform, status WorkerStatus, event watch.EventType) ComponentUpdate {
	name := ComponentShortName(WorkStealerComponent)
	return ComponentUpdate{WorkStealerComponent, status, event, name, namespace, "", platform}
}

func WorkerUpdate(name, namespace, pool string, platform platform.Platform, status WorkerStatus, event watch.EventType) ComponentUpdate {
	return ComponentUpdate{WorkersComponent, status, event, name, namespace, pool, platform}
}
