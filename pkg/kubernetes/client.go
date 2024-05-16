package kubernetes

import (
	k8s "k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"os"
	"path/filepath"
)

// Set up kubernetes API server
func Client() (*k8s.Clientset, error) {
	// TODO $KUBECONFIG...
	kubeConfigPath := filepath.Join(
		os.Getenv("HOME"), ".kube", "config",
	)
	// fmt.Printf("Using kubeconfig: %s\n", kubeConfigPath)

	kubeConfig, err := clientcmd.BuildConfigFromFlags("", kubeConfigPath)
	if err != nil {
		return nil, err
	}

	clientset, err := k8s.NewForConfig(kubeConfig)
	if err != nil {
		return nil, err
	}

	return clientset, nil
}
