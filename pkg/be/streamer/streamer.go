package streamer

import (
	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/lunchpail"
)

type Streamer interface {
	//
	RunEvents() (chan events.Message, error)

	//
	RunComponentUpdates(chan events.ComponentUpdate, chan events.Message) error

	// Stream cpu and memory statistics
	Utilization(intervalSeconds int) (chan utilization.Model, error)

	// Stream queue statistics
	QueueStats(opts qstat.Options) (chan qstat.Model, error)

	// Stream logs from a given Component to os.Stdout
	ComponentLogs(component lunchpail.Component, tail int, follow, verbose bool) error
}
