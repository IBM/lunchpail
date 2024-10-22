package status

import (
	"container/ring"
	"context"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/lunchpail"
)

func StatusStreamer(ctx context.Context, run string, backend be.Backend, verbose bool, nLoglinesMax int, intervalSeconds int) (chan Model, error) {
	c := make(chan Model)

	model := NewModel()
	model.AppName = build.Name()
	model.RunName = run
	model.LastNMessages = ring.New(nLoglinesMax)

	errgroup, sctx := errgroup.WithContext(ctx)
	streamer := backend.Streamer(sctx, queue.RunContext{RunName: run})

	qc := make(chan qstat.Model)
	errgroup.Go(func() error {
		defer close(qc)
		return streamer.QueueStats(qc, qstat.Options{Follow: true, Tail: int64(-1), Verbose: verbose, Quiet: true})
	})

	cpuc := make(chan utilization.Model)
	errgroup.Go(func() error {
		defer close(cpuc)
		return streamer.Utilization(cpuc, intervalSeconds)
	})

	updates := make(chan events.ComponentUpdate)
	messages := make(chan events.Message)
	errgroup.Go(func() error {
		defer close(updates)
		defer close(messages)
		return streamer.RunComponentUpdates(updates, messages)
	})
	errgroup.Go(func() error {
		for update := range updates {
			switch update.Component {
			case lunchpail.WorkStealerComponent:
				model.WorkStealer = update.Status
				c <- *model
			case lunchpail.DispatcherComponent:
				model.Dispatcher = update.Status
				c <- *model
			case lunchpail.WorkersComponent:
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
		msgs, err := streamer.RunEvents()
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

	return c, nil
}
