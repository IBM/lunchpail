package events

import (
	"lunchpail.io/pkg/be/controller"
	"lunchpail.io/pkg/lunchpail"
)

type EventType string

const (
	Deleted  EventType = "deleted"
	Added              = "added"
	Modified           = "modified"
)

func DispatcherUpdate(namespace string, ctrl controller.Controller, status WorkerStatus, event EventType) ComponentUpdate {
	name := lunchpail.ComponentShortName(lunchpail.DispatcherComponent)
	return ComponentUpdate{lunchpail.DispatcherComponent, status, event, name, namespace, "", ctrl}
}

func WorkStealerUpdate(namespace string, ctrl controller.Controller, status WorkerStatus, event EventType) ComponentUpdate {
	name := lunchpail.ComponentShortName(lunchpail.WorkStealerComponent)
	return ComponentUpdate{lunchpail.WorkStealerComponent, status, event, name, namespace, "", ctrl}
}

func WorkerUpdate(name, namespace, pool string, ctrl controller.Controller, status WorkerStatus, event EventType) ComponentUpdate {
	return ComponentUpdate{lunchpail.WorkersComponent, status, event, name, namespace, pool, ctrl}
}
