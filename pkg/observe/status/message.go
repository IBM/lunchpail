package status

import (
	"sort"
	"time"
)

type Message struct {
	timestamp time.Time
	who       string
	message   string
}

func (model *Model) lastOrZero() (time.Time, bool) {
	if msg, ok := model.LastNMessages.Value.(Message); ok && !msg.timestamp.IsZero() {
		return msg.timestamp, true
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
	last, _ := model.lastOrZero()
	if last.IsZero() || !msg.timestamp.Before(last) {
		model.LastNMessages = model.LastNMessages.Next()
		model.LastNMessages.Value = msg

		return true
	}

	return false
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
			return msgs[i].timestamp.Before(msgs[j].timestamp)
		})

		if len(msgs) > max {
			return msgs[(len(msgs) - max):]
		}
	}

	return msgs
}
