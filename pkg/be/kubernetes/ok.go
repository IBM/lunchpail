package kubernetes

import (
	"fmt"
	"os"

	"k8s.io/client-go/discovery"
	"k8s.io/client-go/tools/clientcmd"

	initialize "lunchpail.io/pkg/lunchpail/init"
)

func (backend Backend) Ok() error {
	_, config, err := Client()
	if err != nil {
		if clientcmd.IsEmptyConfig(err) {
			if userIsOkWithInit() {
				return initialize.Local(initialize.InitLocalOptions{BuildImages: true})
			}
			return err
		}

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

func userIsOkWithInit() bool {
	// TODO: add --yes cli option?
	if os.Getenv("CI") != "" || os.Getenv("RUNNING_LUNCHPAIL_TESTS") != "" {
		return true
	}

	var answer string
	fmt.Println("No Kubernetes configuration found. Would you like to initialize a cluster locally? (yes/no)")
	fmt.Scanln(&answer)
	return answer == "yes"
}
