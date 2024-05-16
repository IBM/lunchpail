package status

import (
	"container/ring"
	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/shrinkwrap/qstat"
)

func StatusStreamer(app, run, namespace string, verbose bool, nLoglines int) (chan Model, *errgroup.Group, error) {
	c := make(chan Model)

	podWatcher, eventWatcher, err := startWatching(app, run, namespace)
	if err != nil {
		return c, nil, err
	}

	model := Model{}
	model.AppName = app
	model.RunName = run
	model.Namespace = namespace
	model.LastNMessages = ring.New(nLoglines)

	qc, errgroup, err := qstat.QstatStreamer(run, namespace, qstat.Options{namespace, true, int64(-1), verbose})
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

	return c, errgroup, nil
}
