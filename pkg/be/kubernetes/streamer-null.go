//go:build !full && !observe && !manage

package kubernetes

import (
	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/ir"
	"lunchpail.io/pkg/lunchpail"
)

type NullStreamer struct {
	backend Backend
}

// Return a streamer
func (backend Backend) Streamer() streamer.Streamer {
	return NullStreamer{backend}
}

func (s NullStreamer) RunEvents(appname, runname string) (chan events.Message, error) {
	return nil, nil
}

func (s NullStreamer) RunComponentUpdates(appname, runname string) (chan events.ComponentUpdate, chan events.Message, error) {
	return nil, nil, nil
}

func (s NullStreamer) Utilization(runname string, intervalSeconds int) (chan utilization.Model, error) {
	return nil, nil
}

func (s NullStreamer) QueueStats(runname string, opts qstat.Options) (chan qstat.Model, *errgroup.Group, error) {
	return nil, nil, nil
}

func (s NullStreamer) ComponentLogs(runname string, component lunchpail.Component, follow, verbose bool) error {
	return nil
}

func (backend Backend) Up(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	return nil
}

func (backend Backend) Down(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	return nil
}

func (backend Backend) ListRuns(appName string) ([]runs.Run, error) {
	return []runs.Run{}, nil
}

func (backend Backend) ChangeWorkers(poolName, poolNamespace, poolContext string, delta int) error {
	return nil
}

func (backend Backend) DeleteNamespace(compilationName string) error {
	return nil
}

func (backend Backend) Ok() error {
	return nil
}
