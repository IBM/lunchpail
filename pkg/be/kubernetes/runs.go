package kubernetes

import (
	"context"
	"sort"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"

	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/build"
)

func groupByRun(pods *v1.PodList) []runs.Run {
	runsLookup := make(map[string]runs.Run)
	for _, pod := range pods.Items {
		if runname, exists := pod.Labels["app.kubernetes.io/instance"]; exists {
			if _, alreadySeen := runsLookup[runname]; !alreadySeen {
				runsLookup[runname] = runs.Run{Name: runname, CreationTimestamp: pod.CreationTimestamp.Time}
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

// Return all lunchpail runs for the given appname in the given namespace
func listRuns(ctx context.Context, all bool, appName, namespace string, client kubernetes.Interface) ([]runs.Run, error) {
	label := "app.kubernetes.io/part-of=" + appName

	opts := metav1.ListOptions{LabelSelector: label}
	if !all {
		opts.FieldSelector = "status.phase=Running"
	}

	pods, err := client.CoreV1().Pods(namespace).List(ctx, opts)
	if err != nil {
		return []runs.Run{}, err
	}

	return groupByRun(pods), nil
}

// Return all Runs in the given namespace for the given app
func (backend Backend) ListRuns(ctx context.Context, all bool) ([]runs.Run, error) {
	clientset, _, err := Client()
	if err != nil {
		return []runs.Run{}, err
	}

	return listRuns(ctx, all, build.Name(), backend.namespace, clientset)
}
