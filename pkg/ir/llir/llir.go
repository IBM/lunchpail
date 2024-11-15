package llir

import "lunchpail.io/pkg/lunchpail"

// One Component for WorkStealer, one for Dispatcher, and each per WorkerPool
type Component interface {
	C() lunchpail.Component

	Workers() int

	SetWorkers(w int) Component
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

		switch cc := c.(type) {
		case ShellComponent:
			if cc.Application.Spec.IsDispatcher {
				return true
			}
		}
	}

	return false
}
