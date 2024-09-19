package kubernetes

import (
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	watch "k8s.io/apimachinery/pkg/watch"

	"lunchpail.io/pkg/be/events/utilization"
)

// Stream cpu and memory statistics
func (streamer Streamer) Utilization(c chan utilization.Model, intervalSeconds int) error {
	podWatcher, err := streamer.startWatchingUtilization()
	if err != nil {
		return err
	}

	return streamer.streamPodUtilizationUpdates(podWatcher, intervalSeconds, c)
}

func (streamer Streamer) startWatchingUtilization() (watch.Interface, error) {
	clientset, _, err := Client()
	if err != nil {
		return nil, err
	}

	timeoutSeconds := int64(7 * 24 * time.Hour / time.Second)

	podWatcher, err := clientset.CoreV1().Pods(streamer.backend.namespace).Watch(streamer.Context, metav1.ListOptions{
		TimeoutSeconds: &timeoutSeconds,
		LabelSelector:  "app.kubernetes.io/component,app.kubernetes.io/instance=" + streamer.runname,
	})
	if err != nil {
		return nil, err
	}

	return podWatcher, nil
}
