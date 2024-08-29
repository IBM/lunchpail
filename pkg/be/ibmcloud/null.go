//go:build !full && !manage

package ibmcloud

import (
	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/be/options"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/ir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

type Backend struct {
}

func New(opts NewOptions) (Backend, error) {
	return Backend{}, nil
}

func (backend Backend) Ok() error {
	return nil
}

func (backend Backend) Up(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	return nil
}

func (backend Backend) Down(linked ir.Linked, opts options.CliOptions, verbose bool) error {
	return nil
}

func (backend Backend) DryRun(ir llir.LLIR, cliOpts options.CliOptions, verbose bool) (string, error) {
	return "", nil
}

func (backend Backend) Purge() error {
	return nil
}

type NullStreamer struct {
}

func (backend Backend) Streamer() streamer.Streamer {
	return NullStreamer{}
}

func (streamer NullStreamer) ComponentLogs(runname string, component lunchpail.Component, follow, verbose bool) error {
	return nil
}

func (streamer NullStreamer) QueueStats(runname string, opts qstat.Options) (chan qstat.Model, *errgroup.Group, error) {
	return nil, nil, nil
}

func (streamer NullStreamer) RunEvents(appname, runname string) (chan events.Message, error) {
	return nil, nil
}

func (streamer NullStreamer) RunComponentUpdates(appname, runname string) (chan events.ComponentUpdate, chan events.Message, error) {
	return nil, nil, nil
}

func (streamer NullStreamer) Utilization(runname string, intervalSeconds int) (chan utilization.Model, error) {
	return nil, nil
}