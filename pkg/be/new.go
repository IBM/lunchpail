//go:build full || deploy || manage || observe

package be

import (
	"fmt"

	"lunchpail.io/pkg/be/ibmcloud"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/be/local"
	"lunchpail.io/pkg/be/target"
	"lunchpail.io/pkg/compilation"
)

func makeIt(opts compilation.Options) (Backend, error) {
	switch opts.Target.Platform {
	case target.Local:
		return local.New(), nil
	case target.IBMCloud:
		return ibmcloud.New(ibmcloud.NewOptions{Options: opts, Namespace: opts.Target.Namespace})
	case target.Kubernetes:
		return kubernetes.New(kubernetes.NewOptions{Namespace: opts.Target.Namespace}), nil
	default:
		return nil, fmt.Errorf("Unsupported backend %v", opts.Target.Platform)
	}
}

func NewInitOk(initOk bool, opts compilation.Options) (Backend, error) {
	be, err := makeIt(opts)
	if err != nil {
		return nil, err
	}

	if err := be.Ok(initOk); err != nil {
		return nil, err
	}

	return be, nil
}

func New(opts compilation.Options) (Backend, error) {
	return NewInitOk(false, opts)
}
