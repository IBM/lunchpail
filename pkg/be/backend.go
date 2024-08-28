package be

import (
	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/ir"

	"golang.org/x/sync/errgroup"
)

type Backend interface {
	// Is the backend ready for `up`?
	Ok() error

	// Bring up the linked application
	Up(linked ir.Linked, opts platform.CliOptions, verbose bool) error

	// Bring down the linked application
	Down(linked ir.Linked, opts platform.CliOptions, verbose bool) error

	// Delete namespace
	DeleteNamespace(compilationName string) error

	// List deployed runs
	ListRuns(appName string) ([]runs.Run, error)

	//
	StreamRunEvents(appname, runname string) (chan events.Message, error)

	//
	StreamRunComponentUpdates(appname, runname string) (chan events.ComponentUpdate, chan events.Message, error)

	// Stream cpu and memory statistics
	StreamUtilization(runname string, intervalSeconds int) (chan utilization.Model, error)

	// Stream queue statistics
	StreamQueueStats(runname string, opts qstat.Options) (chan qstat.Model, *errgroup.Group, error)
}
