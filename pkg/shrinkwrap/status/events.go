package status

import (
	v1 "k8s.io/api/core/v1"
	watch "k8s.io/apimachinery/pkg/watch"
)

func streamEventUpdates(model *Model, watcher watch.Interface, c chan Model) error {
	for watchEvent := range watcher.ResultChan() {
		event := watchEvent.Object.(*v1.Event)

		if model.LastEvent.Timestamp.IsZero() || event.LastTimestamp.After(model.LastEvent.Timestamp) {
			model.LastEvent = Event{event.Message, event.LastTimestamp.Time}
			c <- *model
		}
	}

	return nil
}
