package cpu

import (
	"context"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	watch "k8s.io/apimachinery/pkg/watch"
	"lunchpail.io/pkg/be/kubernetes"
)

func startWatching(run, namespace string) (watch.Interface, error) {
	clientset, _, err := kubernetes.Client()
	if err != nil {
		return nil, err
	}

	timeoutSeconds := int64(7 * 24 * time.Hour / time.Second)

	podWatcher, err := clientset.CoreV1().Pods(namespace).Watch(context.Background(), metav1.ListOptions{
		TimeoutSeconds: &timeoutSeconds,
		LabelSelector:  "app.kubernetes.io/component,app.kubernetes.io/instance=" + run,
	})
	if err != nil {
		return nil, err
	}

	return podWatcher, nil
}
