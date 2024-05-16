package status

import (
	"context"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	watch "k8s.io/apimachinery/pkg/watch"
	"lunchpail.io/pkg/kubernetes"
)

func startWatching(app, run, namespace string) (watch.Interface, watch.Interface, error) {
	clientset, err := kubernetes.Client()
	if err != nil {
		return nil, nil, err
	}

	timeoutSeconds := int64(7 * 24 * time.Hour / time.Second)

	podWatcher, err := clientset.CoreV1().Pods(namespace).Watch(context.Background(), metav1.ListOptions{
		TimeoutSeconds: &timeoutSeconds,
		LabelSelector:  "app.kubernetes.io/component,app.kubernetes.io/instance=" + run,
	})
	if err != nil {
		return nil, nil, err
	}

	eventWatcher, err := clientset.CoreV1().Events(namespace).Watch(context.Background(), metav1.ListOptions{
		TimeoutSeconds: &timeoutSeconds,
	})
	if err != nil {
		return nil, nil, err
	}

	return podWatcher, eventWatcher, nil
}
