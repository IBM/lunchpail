package status

import (
	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/shrinkwrap/qstat"
)

func StatusStreamer(app, run, namespace string, verbose bool) (chan Model, *errgroup.Group, error) {
	c := make(chan Model)

	podWatcher, eventWatcher, err := startWatching(app, run, namespace)
	if err != nil {
		return c, nil, err
	}

	model := Model{}
	model.AppName = app
	model.RunName = run

	qc, errgroup, err := qstat.QstatStreamer(run, namespace, qstat.Options{namespace, true, int64(-1), verbose})
	if err != nil {
		return c, nil, err
	}

	errgroup.Go(func() error {
		return streamPodUpdates(&model, podWatcher, c)
	})

	errgroup.Go(func() error {
		return streamEventUpdates(&model, eventWatcher, c)
	})

	errgroup.Go(func() error {
		return streamQstatUpdates(&model, qc, c)
	})

	return c, errgroup, nil
}
