package llir

import (
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/lunchpail"
)

// One Component for WorkStealer, one for Dispatcher, and each per WorkerPool
type Component interface {
	C() lunchpail.Component

	Workers() int

	SetWorkers(w int) Component
}

// Specification of the queue, e.g. endpoint
type Queue = queue.Spec

type LLIR struct {
	AppName string
	RunName string

	// Applications may provide their own Kubernetes resources
	// that will be deployed once per run
	AppProvidedKubernetesResources string

	// Details of how to reach the queue endpoint
	Queue

	// One Component per WorkerPool, one for WorkerStealer, etc.
	Components []Component
}

func (ir LLIR) HasDispatcher() bool {
	for _, c := range ir.Components {
		if c.C() == lunchpail.DispatcherComponent {
			return true
		}
	}

	return false
}
