package kubernetes

import (
	"k8s.io/client-go/discovery"
)

func Ok() error {
	_, config, err := Client()
	if err != nil {
		return err
	}

	discoveryClient, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return err
	}

	if _, err := discoveryClient.ServerVersion(); err != nil {
		return err
	}

	return nil
}
