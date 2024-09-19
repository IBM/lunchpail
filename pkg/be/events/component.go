package events

import (
	"lunchpail.io/pkg/be/controller"
	"lunchpail.io/pkg/lunchpail"
)

type ComponentUpdate struct {
	lunchpail.Component
	Status WorkerStatus
	Type   EventType

	Name string
	Pool string
	Ctrl controller.Controller
}
