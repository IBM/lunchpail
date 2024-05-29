package status

import (
	"container/ring"
	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/observe"
	"lunchpail.io/pkg/observe/cpu"
	"lunchpail.io/pkg/observe/qstat"
)

func StatusStreamer(app, run, namespace string, verbose bool, nLoglinesMax int, intervalSeconds int) (chan Model, *errgroup.Group, error) {
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

	qc, errgroup, err := qstat.QstatStreamer(run, namespace, qstat.Options{Namespace: namespace, Follow: true, Tail: int64(-1), Verbose: verbose, Quiet: true})
	if err != nil {
		return c, nil, err
	}

	cpuc, err := cpu.CpuStreamer(run, namespace, intervalSeconds)
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
		return model.streamLogUpdates(run, namespace, observe.WorkersComponent, c)
	})

	errgroup.Go(func() error {
		return model.streamLogUpdates(run, namespace, observe.DispatcherComponent, c)
	})

	errgroup.Go(func() error {
		return model.streamQstatUpdates(qc, c)
	})

	errgroup.Go(func() error {
		return model.streamCpuUpdates(cpuc, c)
	})

	return c, errgroup, nil
}
