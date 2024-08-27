package be

import (
	"fmt"

	"lunchpail.io/pkg/be/ibmcloud"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/compilation"
)

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
