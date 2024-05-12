package qstat

import (
	"context"
	"golang.org/x/sync/errgroup"
)

type Options struct {
	Namespace string
	Follow    bool
	Tail      int64
	Verbose   bool
}

type Worker struct {
	Name       string
	Inbox      int
	Processing int
	Outbox     int
	Errorbox   int
}

type QstatModel struct {
	Valid       bool
	Timestamp   string
	Unassigned  int
	Assigned    int
	Processing  int
	Success     int
	Failure     int
	LiveWorkers []Worker
	DeadWorkers []Worker
}

func QstatStreamer(runname, namespace string, opts Options) (chan QstatModel, *errgroup.Group, error) {
	c := make(chan QstatModel)

	errs, _ := errgroup.WithContext(context.Background())
	errs.Go(func() error {
		err := streamModel(runname, namespace, opts.Follow, opts.Tail, c)
		close(c)
		return err
	})

	return c, errs, nil
}
