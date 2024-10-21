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

type Context struct {
	Run   queue.RunContext
	Queue queue.Spec
}

type LLIR struct {
	AppName string

	// The context that defines a run (run name, step, etc.)
	Context

	// Applications may provide their own Kubernetes resources
	// that will be deployed once per run
	AppProvidedKubernetesResources string

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

func (ir LLIR) RunName() string {
	return ir.Context.Run.RunName
}

func (ir LLIR) Queue() queue.Spec {
	return ir.Context.Queue
}
