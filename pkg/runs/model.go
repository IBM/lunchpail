package runs

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

type Run struct {
	Name string
}

// Return all Runs in the given namespace for the given app
func List(appName, namespace string) ([]Run, error) {
	clientset, err := kubeApiServerClient()
	if err != nil {
		return []Run{}, err
	}

	controllers, err := ListControllers(appName, namespace, clientset)
	if err != nil {
		return []Run{}, err
	}

	var allRuns []Run
	for _, controller := range controllers.Items {
		if runName, exists := controller.Labels["app.kubernetes.io/instance"]; exists {
			allRuns = append(allRuns, Run{Name: runName})
		} else {
			fmt.Fprintf(os.Stderr, "Warning: found controller without instance label %s", controller.String())
		}
	}
	return allRuns, nil
}

// Return a Run if there is one in the given namespace for the given
// app, otherwise error
func Singleton(appName, namespace string) (Run, error) {
	runs, err := List(appName, namespace)
	if err != nil {
		return Run{}, err
	}
	if len(runs) == 1 {
		return runs[0], nil
	} else if len(runs) > 1 {
		return Run{}, fmt.Errorf("more than one run found in namespace %s", namespace)
	} else {
		return Run{}, fmt.Errorf("no runs found in namespace %s", namespace)
	}
}

// Set up kubernetes API server
func kubeApiServerClient() (*kubernetes.Clientset, error) {
	// TODO $KUBECONFIG...
	kubeConfigPath := filepath.Join(
		os.Getenv("HOME"), ".kube", "config",
	)
	// fmt.Printf("Using kubeconfig: %s\n", kubeConfigPath)

	kubeConfig, err := clientcmd.BuildConfigFromFlags("", kubeConfigPath)
	if err != nil {
		return nil, err
	}

	clientset, err := kubernetes.NewForConfig(kubeConfig)
	if err != nil {
		return nil, err
	}

	return clientset, nil
}

// Return all lunchpail controller pods for the given appname in the given namespace
func ListControllers(appName, namespace string, client kubernetes.Interface) (*v1.PodList, error) {
	label := "app.kubernetes.io/component=lunchpail-controller,app.kubernetes.io/part-of=" + appName

	jobs, err := client.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: label})
	if err != nil {
		return nil, err
	}
	return jobs, nil
}
