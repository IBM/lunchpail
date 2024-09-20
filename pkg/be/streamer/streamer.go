package streamer

import (
	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/lunchpail"
)

type LogOptions struct {
	Tail       int
	Follow     bool
	Verbose    bool
	LinePrefix string
}

type Streamer interface {
	//
	RunEvents() (chan events.Message, error)

	//
	RunComponentUpdates(chan events.ComponentUpdate, chan events.Message) error

	// Stream cpu and memory statistics
	Utilization(c chan utilization.Model, intervalSeconds int) error

	// Stream queue statistics
	QueueStats(c chan qstat.Model, opts qstat.Options) error

	// Stream logs from a given Component to os.Stdout
	ComponentLogs(component lunchpail.Component, opts LogOptions) error
}
