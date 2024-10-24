package qstat

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/ir/queue"
)

type QlastOptions struct {
}

func Qlast(ctx context.Context, marker, opt string, backend be.Backend, opts QlastOptions) (string, error) {
	runname, err := util.WaitForRun(ctx, "", true, backend)
	if err != nil {
		return "", err
	}

	c := make(chan qstat.Model)

	group, _ := errgroup.WithContext(ctx)
	group.Go(func() error {
		defer close(c)
		return backend.Streamer(ctx, queue.RunContext{RunName: runname}).QueueStats(c, qstat.Options{Tail: int64(1000)})
	})

	var lastmodel qstat.Model
	for model := range c {
		lastmodel = model
	}

	if lastmodel.Valid {
		switch marker {
		case "unassigned":
			return strconv.Itoa(lastmodel.Unassigned), nil
		case "liveworkers":
			return strconv.Itoa(lastmodel.LiveWorkers()), nil
		case "workers":
			return strconv.Itoa(lastmodel.Workers()), nil
		case "processing":
			return strconv.Itoa(lastmodel.Processing), nil
		case "success":
			return strconv.Itoa(lastmodel.Success), nil
		case "failure":
			return strconv.Itoa(lastmodel.Failure), nil
		case "worker.success":
			vals := []int{}
			for _, pool := range lastmodel.Pools {
				for _, worker := range pool.LiveWorkers {
					vals = append(vals, worker.Outbox)
				}
				for _, worker := range pool.DeadWorkers {
					vals = append(vals, worker.Outbox)
				}
			}

			// turns an array [1,2,3] into a string "1 2 3", i.e. the delimeter is " "
			// and we trim off the surrounding brackets
			delim := " "
			return strings.Trim(strings.Join(strings.Fields(fmt.Sprint(vals)), delim), "[]"), nil
		}
	}

	return strconv.Itoa(0), nil
}
