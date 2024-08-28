//go:build full || manage || observe

package kubernetes

import (
	k8s "k8s.io/client-go/kubernetes"
	restclient "k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// Set up kubernetes API server
func Client() (*k8s.Clientset, *restclient.Config, error) {
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	configOverrides := &clientcmd.ConfigOverrides{}
	kubeConfig, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides).ClientConfig()
	if err != nil {
		return nil, nil, err
	}

	clientset, err := k8s.NewForConfig(kubeConfig)
	if err != nil {
		return nil, nil, err
	}

	return clientset, kubeConfig, nil
}
