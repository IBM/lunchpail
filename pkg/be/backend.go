package be

import (
	"fmt"

	"lunchpail.io/pkg/be/ibmcloud"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/ir"
)

type Backend interface {
	// Is the backend ready for `up`?
	Ok() error

	// Bring up the linked application
	Up(linked ir.Linked, opts platform.CliOptions, verbose bool) error

	// Bring down the linked application
	Down(linked ir.Linked, opts platform.CliOptions, verbose bool) error

	// Delete namespace
	DeleteNamespace(compilationName, namespace string) error

	// List deployed runs
	ListRuns(appName, namespace string) ([]runs.Run, error)
}

func New(backend platform.Platform, aopts compilation.Options) (Backend, error) {
	var be Backend

	switch backend {
	case platform.Kubernetes:
		be = kubernetes.Backend{}
	case platform.IBMCloud:
		if ibm, err := ibmcloud.New(aopts); err != nil {
			return nil, err
		} else {
			be = ibm
		}
	default:
		return nil, fmt.Errorf("Unsupported backend %v", backend)
	}

	if err := be.Ok(); err != nil {
		return nil, err
	}

	return be, nil
}
