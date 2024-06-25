package events

import "time"

type Message struct {
	Timestamp time.Time
	Who       string
	Message   string
}
