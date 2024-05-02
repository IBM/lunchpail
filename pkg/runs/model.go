package runs

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	batchv1 "k8s.io/api/batch/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

type Run struct {
	Name string
}

func List(appName, namespace string) ([]Run, error) {
	clientset, err := kubeApiServerClient()
	if err != nil {
		return []Run{}, err
	}

	jobs, err := ListJobs(appName, namespace, clientset)
	if err != nil {
		return []Run{}, err
	}

	var allRuns []Run
	for _, job := range jobs.Items {
		if runName, exists := job.Labels["app.kubernetes.io/instance"]; exists {
			allRuns = append(allRuns, Run{Name: runName})
		} else {
			fmt.Fprintf(os.Stderr, "Warning: found job without instance label %s", job.String())
		}
	}
	return allRuns, nil
}

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
	kubeConfigPath := filepath.Join(
		os.Getenv("HOME"), ".kube", "config",
	)
	fmt.Printf("Using kubeconfig: %s\n", kubeConfigPath)

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

// Get all jobs
func ListJobs(appName, namespace string, client kubernetes.Interface) (*batchv1.JobList, error) {
	label := "app.kubernetes.io/component=workerpool,app.kubernetes.io/part-of=" + appName

	jobs, err := client.BatchV1().Jobs(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: label})
	if err != nil {
		err = fmt.Errorf("error getting jobs: %v", err)
		return nil, err
	}
	return jobs, nil
}
