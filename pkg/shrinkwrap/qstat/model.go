package qstat

import (
	"context"
	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/lunchpail"
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

func QstatStreamer(opts Options) (chan QstatModel, *errgroup.Group, error) {
	namespace := lunchpail.AssembledAppName()
	if opts.Namespace != "" {
		namespace = opts.Namespace
	}

	c := make(chan QstatModel)

	errs, _ := errgroup.WithContext(context.Background())
	errs.Go(func() error {
		err := stream(namespace, opts.Follow, opts.Tail, c)
		close(c)
		return err
	})

	return c, errs, nil
}
