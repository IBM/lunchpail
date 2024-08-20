package llir

import (
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/lunchpail"
)

// One Component for WorkStealer, one for Dispatcher, and each per WorkerPool
type Component interface {
	C() lunchpail.Component

	Workers() int

	SetWorkers(w int) Component
}

type Values struct {
	Yaml string
}

type LLIR struct {
	AppName   string
	RunName   string
	Namespace string

	// Resources that are shared across all Components and are
	// specific to running in a Kubernetes cluster
	K8sCommonResources string

	// Details of how to reach the queue endpoint
	Queue queue.Spec

	// Template values
	Values

	// One Component per WorkerPool, one for WorkerStealer, etc.
	Components []Component
}

/*func (ir LLIR) Jobs() []Component {
	jobs := []Component{}
	for _, c := range ir.Components {
		if c.IsJob() {
			jobs = append(jobs, c)
		}
	}
	return jobs
        }*/
