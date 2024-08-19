package llir

import (
	"lunchpail.io/pkg/fe/linker/queue"
)

type ApplicationInstanceSpec struct {
	// Use a Job-style (versus Pod-style) of deployment?
	RunAsJob bool

	// Defaults to run name
	InstanceName string

	// Details of how to reach the queue endpoint
	Queue queue.Spec

	// Where runners of this instance should pick up or dispatch queue data
	QueuePrefixPath string

	// Kubernetes-specific
	ServiceAccount string

	// Sizing of this instance
	Sizing RunSizeConfig
}
