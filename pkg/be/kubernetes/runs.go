package kubernetes

import (
	"context"
	"sort"

	batchv1 "k8s.io/api/batch/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"lunchpail.io/pkg/be/runs"
)

func groupByRun(jobs *batchv1.JobList) []runs.Run {
	runsLookup := make(map[string]runs.Run)
	for _, job := range jobs.Items {
		if runname, exists := job.Labels["app.kubernetes.io/instance"]; exists {
			if _, alreadySeen := runsLookup[runname]; !alreadySeen {
				runsLookup[runname] = runs.Run{Name: runname, CreationTimestamp: job.CreationTimestamp.Time}
			}
		}
	}

	runs := []runs.Run{}
	for _, run := range runsLookup {
		runs = append(runs, run)
	}

	sort.Slice(runs, func(i, j int) bool { return runs[i].CreationTimestamp.Before(runs[j].CreationTimestamp) })

	return runs
}

// Return all lunchpail Jobs for the given appname in the given namespace
func listRuns(appName, namespace string, client kubernetes.Interface) ([]runs.Run, error) {
	label := "app.kubernetes.io/component=workerpool,app.kubernetes.io/part-of=" + appName

	jobs, err := client.BatchV1().Jobs(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: label})
	if err != nil {
		return []runs.Run{}, err
	}

	return groupByRun(jobs), nil
}

// Return all Runs in the given namespace for the given app
func (backend Backend) ListRuns(appName string) ([]runs.Run, error) {
	clientset, _, err := Client()
	if err != nil {
		return []runs.Run{}, err
	}

	return listRuns(appName, backend.namespace, clientset)
}
