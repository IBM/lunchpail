package status

import (
	"container/ring"
	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/observe/cpu"
	"lunchpail.io/pkg/observe/events"
	"lunchpail.io/pkg/observe/qstat"
)

func StatusStreamer(app, run, namespace string, verbose bool, nLoglinesMax int, intervalSeconds int) (chan Model, *errgroup.Group, error) {
	c := make(chan Model)

	model := NewModel()
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

	updates, messages, err := be.StreamRunComponentUpdates(app, run, namespace)
	if err != nil {
		return c, nil, err
	}
	errgroup.Go(func() error {
		for update := range updates {
			switch update.Component {
			case events.WorkStealerComponent:
				model.WorkStealer = update.Status
				c <- *model
			case events.DispatcherComponent:
				model.Dispatcher = update.Status
				c <- *model
			case events.WorkersComponent:
				pools, err := updateWorker(update, model.Pools)
				if err != nil {
					return err
				}
				model.Pools = pools
			}
		}
		return nil
	})
	errgroup.Go(func() error {
		for msg := range messages {
			if model.addMessage(msg) {
				c <- *model
			}
		}
		return nil
	})

	errgroup.Go(func() error {
		msgs, err := be.StreamRunEvents(app, run, namespace)
		if err != nil {
			return err
		}
		for msg := range msgs {
			if model.addMessage(msg) {
				c <- *model
			}
		}
		return nil
	})

	errgroup.Go(func() error {
		return model.streamQstatUpdates(qc, c)
	})

	errgroup.Go(func() error {
		return model.streamCpuUpdates(cpuc, c)
	})

	return c, errgroup, nil
}
