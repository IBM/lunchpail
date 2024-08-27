package events

import (
	watch "k8s.io/apimachinery/pkg/watch"

	"lunchpail.io/pkg/be/controller"
	"lunchpail.io/pkg/lunchpail"
)

type ComponentUpdate struct {
	Component lunchpail.Component
	Status    WorkerStatus
	Type      watch.EventType

	Name      string
	Namespace string
	Pool      string
	Ctrl      controller.Controller
}
