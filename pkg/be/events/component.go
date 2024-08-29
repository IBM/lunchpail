package events

import (
	"lunchpail.io/pkg/be/controller"
	"lunchpail.io/pkg/lunchpail"
)

type ComponentUpdate struct {
	Component lunchpail.Component
	Status    WorkerStatus
	Type      EventType

	Name      string
	Namespace string
	Pool      string
	Ctrl      controller.Controller
}
