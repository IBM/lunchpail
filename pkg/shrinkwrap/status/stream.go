package status

import (
	"container/ring"
	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/shrinkwrap/cpu"
	"lunchpail.io/pkg/shrinkwrap/qstat"
)

func StatusStreamer(app, run, namespace string, verbose bool, nLoglinesMax int, interval int) (chan Model, *errgroup.Group, error) {
	c := make(chan Model)

	podWatcher, eventWatcher, err := startWatching(app, run, namespace)
	if err != nil {
		return c, nil, err
	}

	model := Model{}
	model.AppName = app
	model.RunName = run
	model.Namespace = namespace
	model.LastNMessages = ring.New(nLoglinesMax)

	qc, errgroup, err := qstat.QstatStreamer(run, namespace, qstat.Options{namespace, true, int64(-1), verbose, true})
	if err != nil {
		return c, nil, err
	}

	cpuc, err := cpu.CpuStreamer(run, namespace, interval)
	if err != nil {
		return c, nil, err
	}

	errgroup.Go(func() error {
		return model.streamPodUpdates(podWatcher, c)
	})

	errgroup.Go(func() error {
		return model.streamEventUpdates(eventWatcher, c)
	})

	errgroup.Go(func() error {
		return model.streamLogUpdates(run, namespace, lunchpail.DispatcherComponent, c)
	})

	errgroup.Go(func() error {
		return model.streamQstatUpdates(qc, c)
	})

	errgroup.Go(func() error {
		return model.streamCpuUpdates(cpuc, c)
	})

	return c, errgroup, nil
}
