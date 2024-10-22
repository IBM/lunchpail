package kubernetes

import (
	"strings"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	watch "k8s.io/apimachinery/pkg/watch"

	"lunchpail.io/pkg/be/events"
)

// ugh, i don't see a way to track events for a *class* of pods, e.g. by label selector
func relevantToRun(event *v1.Event, runname string) bool {
	return strings.HasPrefix(event.InvolvedObject.Name, runname)
}

func stream(runname string, watcher watch.Interface, c chan events.Message) {
	for watchEvent := range watcher.ResultChan() {
		event := watchEvent.Object.(*v1.Event)

		if event.Message != "" && relevantToRun(event, runname) {
			c <- events.Message{Timestamp: event.LastTimestamp.Time, Who: "Cluster", Message: event.Message}
		}
	}
}

func (streamer Streamer) RunEvents() (chan events.Message, error) {
	clientset, _, err := Client()
	if err != nil {
		return nil, err
	}

	timeout := timeoutSeconds
	eventWatcher, err := clientset.CoreV1().Events(streamer.backend.namespace).Watch(streamer.Context, metav1.ListOptions{
		TimeoutSeconds: &timeout,
	})
	if err != nil {
		return nil, err
	}

	c := make(chan events.Message)
	go stream(streamer.run.RunName, eventWatcher, c)

	return c, nil
}
