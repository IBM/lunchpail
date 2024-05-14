package status

import (
	v1 "k8s.io/api/core/v1"
	watch "k8s.io/apimachinery/pkg/watch"
)

func (model *Model) streamEventUpdates(watcher watch.Interface, c chan Model) error {
	for watchEvent := range watcher.ResultChan() {
		event := watchEvent.Object.(*v1.Event)

		if event.Message != "" {
			model.LastNEvents = model.LastNEvents.Next()
			model.LastNEvents.Value = Event{event.Message, event.LastTimestamp.Time}
			c <- *model
		}
	}

	return nil
}
