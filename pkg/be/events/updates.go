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

func DispatcherUpdate(ctrl controller.Controller, status WorkerStatus, event EventType) ComponentUpdate {
	name := lunchpail.ComponentShortName(lunchpail.DispatcherComponent)
	return ComponentUpdate{lunchpail.DispatcherComponent, status, event, name, "", ctrl}
}

func WorkStealerUpdate(ctrl controller.Controller, status WorkerStatus, event EventType) ComponentUpdate {
	name := lunchpail.ComponentShortName(lunchpail.WorkStealerComponent)
	return ComponentUpdate{lunchpail.WorkStealerComponent, status, event, name, "", ctrl}
}

func WorkerUpdate(name, pool string, ctrl controller.Controller, status WorkerStatus, event EventType) ComponentUpdate {
	return ComponentUpdate{lunchpail.WorkersComponent, status, event, name, pool, ctrl}
}
