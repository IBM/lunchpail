package events

import (
	watch "k8s.io/apimachinery/pkg/watch"
	"lunchpail.io/pkg/be/platform"
	comp "lunchpail.io/pkg/lunchpail"
)

type ComponentUpdate struct {
	Component comp.Component
	Status    WorkerStatus
	Type      watch.EventType

	Name      string
	Namespace string
	Pool      string
	Platform  platform.Platform
}

func DispatcherUpdate(namespace string, platform platform.Platform, status WorkerStatus, event watch.EventType) ComponentUpdate {
	name := ComponentShortName(comp.DispatcherComponent)
	return ComponentUpdate{comp.DispatcherComponent, status, event, name, namespace, "", platform}
}

func WorkStealerUpdate(namespace string, platform platform.Platform, status WorkerStatus, event watch.EventType) ComponentUpdate {
	name := ComponentShortName(comp.WorkStealerComponent)
	return ComponentUpdate{comp.WorkStealerComponent, status, event, name, namespace, "", platform}
}

func WorkerUpdate(name, namespace, pool string, platform platform.Platform, status WorkerStatus, event watch.EventType) ComponentUpdate {
	return ComponentUpdate{comp.WorkersComponent, status, event, name, namespace, pool, platform}
}
