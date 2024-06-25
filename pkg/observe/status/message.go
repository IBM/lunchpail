package status

import (
	"sort"
	"time"

	"lunchpail.io/pkg/observe/events"
)

type Message = events.Message

func (model *Model) lastOrZero() (time.Time, bool) {
	if msg, ok := model.LastNMessages.Value.(Message); ok && !msg.Timestamp.IsZero() {
		return msg.Timestamp, true
	}

	return time.Time{}, false
}

func (model *Model) last() time.Time {
	if t, ok := model.lastOrZero(); ok {
		return t
	}

	return time.Now()
}

func (model *Model) addMessage(msg Message) bool {
	if model.updateProgress(msg) {
		return true
	}

	last, _ := model.lastOrZero()
	if last.IsZero() || !msg.Timestamp.Before(last) {
		model.LastNMessages = model.LastNMessages.Next()
		model.LastNMessages.Value = msg

		return true
	}

	return false
}

func (model *Model) addErrorMessage(msg string, err error) *Model {
	model.addMessage(Message{Timestamp: time.Now(), Who: "Error", Message: msg + ": " + err.Error()})
	return model
}

func (model *Model) messages(max int) []Message {
	msgs := []Message{}

	if model.LastNMessages != nil {
		model.LastNMessages.Do(func(value any) {
			if msg, ok := value.(Message); ok {
				msgs = append(msgs, msg)
			}
		})

		sort.Slice(msgs, func(i, j int) bool {
			return msgs[i].Timestamp.Before(msgs[j].Timestamp)
		})

		if len(msgs) > max {
			return msgs[(len(msgs) - max):]
		}
	}

	return msgs
}
