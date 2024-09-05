package streamer

import (
	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/lunchpail"
)

type Streamer interface {
	//
	RunEvents(runname string) (chan events.Message, error)

	//
	RunComponentUpdates(runname string) (chan events.ComponentUpdate, chan events.Message, error)

	// Stream cpu and memory statistics
	Utilization(runname string, intervalSeconds int) (chan utilization.Model, error)

	// Stream queue statistics
	QueueStats(runname string, opts qstat.Options) (chan qstat.Model, *errgroup.Group, error)

	// Stream logs from a given Component to os.Stdout
	ComponentLogs(runname string, component lunchpail.Component, tail int, follow, verbose bool) error
}
