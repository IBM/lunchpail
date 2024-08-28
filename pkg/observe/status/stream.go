package status

import (
	"container/ring"

	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/events/qstat"
	comp "lunchpail.io/pkg/lunchpail"
)

func StatusStreamer(app, run string, backend be.Backend, verbose bool, nLoglinesMax int, intervalSeconds int) (chan Model, *errgroup.Group, error) {
	c := make(chan Model)

	model := NewModel()
	model.AppName = app
	model.RunName = run
	model.LastNMessages = ring.New(nLoglinesMax)

	qc, errgroup, err := backend.Streamer().QueueStats(run, qstat.Options{Follow: true, Tail: int64(-1), Verbose: verbose, Quiet: true})
	if err != nil {
		return c, nil, err
	}

	cpuc, err := backend.Streamer().Utilization(run, intervalSeconds)
	if err != nil {
		return c, nil, err
	}

	updates, messages, err := backend.Streamer().RunComponentUpdates(app, run)
	if err != nil {
		return c, nil, err
	}
	errgroup.Go(func() error {
		for update := range updates {
			switch update.Component {
			case comp.WorkStealerComponent:
				model.WorkStealer = update.Status
				c <- *model
			case comp.DispatcherComponent:
				model.Dispatcher = update.Status
				c <- *model
			case comp.WorkersComponent:
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
		msgs, err := backend.Streamer().RunEvents(app, run)
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
