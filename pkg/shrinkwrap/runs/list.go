package runs

import (
	"context"
	"fmt"
	"os"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	k8s "lunchpail.io/pkg/be/kubernetes"
)

// Return all lunchpail controller pods for the given appname in the given namespace
func ListControllers(appName, namespace string, client kubernetes.Interface) (*v1.PodList, error) {
	label := "app.kubernetes.io/component=lunchpail-controller,app.kubernetes.io/part-of=" + appName

	jobs, err := client.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: label})
	if err != nil {
		return nil, err
	}
	return jobs, nil
}

// Return all Runs in the given namespace for the given app
func List(appName, namespace string) ([]Run, error) {
	clientset, _, err := k8s.Client()
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
