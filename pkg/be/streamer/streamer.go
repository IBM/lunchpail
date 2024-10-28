package streamer

import (
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/lunchpail"
)

type LinePrefixFunction = func(instanceName string) string

type LogOptions struct {
	Tail       int
	Follow     bool
	Verbose    bool
	LinePrefix LinePrefixFunction
}

type Streamer interface {
	// Stream cpu and memory statistics
	Utilization(c chan utilization.Model, intervalSeconds int) error

	// Stream queue statistics
	QueueStats(c chan qstat.Model, opts qstat.Options) error

	// Stream logs from a given Component to os.Stdout
	ComponentLogs(component lunchpail.Component, opts LogOptions) error
}
