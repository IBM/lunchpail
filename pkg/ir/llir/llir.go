package llir

type LLIR struct {
	AppName string

	// The context that defines a run (run name, step, etc.)
	Context

	// Applications may provide their own Kubernetes resources
	// that will be deployed once per run
	AppProvidedKubernetesResources string

	// One Component per WorkerPool, one for WorkerStealer, etc.
	Components []ShellComponent
}

func (ir LLIR) HasDispatcher() bool {
	for _, c := range ir.Components {
		if c.Application.Spec.IsDispatcher {
			return true
		}
	}

	return false
}
