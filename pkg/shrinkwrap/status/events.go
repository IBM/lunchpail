package status

import (
	v1 "k8s.io/api/core/v1"
	watch "k8s.io/apimachinery/pkg/watch"
)

func streamEventUpdates(status *Status, watcher watch.Interface, c chan Status) error {
	for watchEvent := range watcher.ResultChan() {
		event := watchEvent.Object.(*v1.Event)

		if status.LastEvent.Timestamp.IsZero() || event.LastTimestamp.After(status.LastEvent.Timestamp.Time) {
			status.LastEvent = Event{event.Message, event.LastTimestamp}
			c <- *status
		}
	}

	return nil
}
