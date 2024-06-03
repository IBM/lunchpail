package status

import (
	"strings"
	"time"

	v1 "k8s.io/api/core/v1"
	watch "k8s.io/apimachinery/pkg/watch"
)

type Event struct {
	Message   string
	Timestamp time.Time
}

// ugh, i don't see a way to track events for a *class* of pods, e.g. by label selector
func relevantToRun(event *v1.Event, runname string) bool {
	return strings.HasPrefix(event.InvolvedObject.Name, runname)
}

func (model *Model) streamEventUpdates(runname string, watcher watch.Interface, c chan Model) error {
	for watchEvent := range watcher.ResultChan() {
		event := watchEvent.Object.(*v1.Event)

		if event.Message != "" && relevantToRun(event, runname) {
			if model.addMessage(Message{event.LastTimestamp.Time, "Cluster", event.Message}) {
				c <- *model
			}
		}
	}

	return nil
}
