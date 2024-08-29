//go:build full || deploy || manage || observe

package be

import (
	"fmt"

	"lunchpail.io/pkg/be/ibmcloud"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/be/local"
	"lunchpail.io/pkg/compilation"
)

type TargetOptions struct {
	Namespace      string
	TargetPlatform Platform
}

func makeIt(topts TargetOptions, aopts compilation.Options) (Backend, error) {
	switch topts.TargetPlatform {
	case Local:
		return local.New(), nil
	case Kubernetes:
		return kubernetes.New(kubernetes.NewOptions{Namespace: topts.Namespace}), nil
	case IBMCloud:
		return ibmcloud.New(ibmcloud.NewOptions{Options: aopts, Namespace: topts.Namespace})
	default:
		return nil, fmt.Errorf("Unsupported backend %v", topts.TargetPlatform)
	}
}

func NewInitOk(initOk bool, topts TargetOptions, aopts compilation.Options) (Backend, error) {
	be, err := makeIt(topts, aopts)
	if err != nil {
		return nil, err
	}

	if err := be.Ok(initOk); err != nil {
		return nil, err
	}

	return be, nil
}

func New(topts TargetOptions, aopts compilation.Options) (Backend, error) {
	return NewInitOk(false, topts, aopts)
}
