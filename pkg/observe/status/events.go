package status

import (
	"time"

	v1 "k8s.io/api/core/v1"
	watch "k8s.io/apimachinery/pkg/watch"
)

type Event struct {
	Message   string
	Timestamp time.Time
}

func (model *Model) streamEventUpdates(watcher watch.Interface, c chan Model) error {
	for watchEvent := range watcher.ResultChan() {
		event := watchEvent.Object.(*v1.Event)

		if event.Message != "" {
			if model.addMessage(Message{event.LastTimestamp.Time, "Cluster", event.Message}) {
				c <- *model
			}
		}
	}

	return nil
}
