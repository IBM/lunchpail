package runs

import (
	"context"

	batchv1 "k8s.io/api/batch/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	k8s "lunchpail.io/pkg/be/kubernetes"
)

func groupByRun(jobs *batchv1.JobList) []Run {
	runsLookup := make(map[string]Run)
	for _, job := range jobs.Items {
		if runname, exists := job.Labels["app.kubernetes.io/instance"]; exists {
			if _, alreadySeen := runsLookup[runname]; !alreadySeen {
				runsLookup[runname] = Run{Name: runname}
			}
		}
	}

	runs := []Run{}
	for _, run := range runsLookup {
		runs = append(runs, run)
	}

	return runs
}

// Return all lunchpail Jobs for the given appname in the given namespace
func listRuns(appName, namespace string, client kubernetes.Interface) ([]Run, error) {
	label := "app.kubernetes.io/component=workerpool,app.kubernetes.io/part-of=" + appName

	jobs, err := client.BatchV1().Jobs(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: label})
	if err != nil {
		return []Run{}, err
	}

	return groupByRun(jobs), nil
}

// Return all Runs in the given namespace for the given app
func List(appName, namespace string) ([]Run, error) {
	clientset, _, err := k8s.Client()
	if err != nil {
		return []Run{}, err
	}

	return listRuns(appName, namespace, clientset)
}
