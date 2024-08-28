package qstat

import (
	"fmt"
	"strconv"
	"strings"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/runs/util"
)

type QlastOptions struct {
}

func Qlast(marker, opt string, backend be.Backend, opts QlastOptions) (string, error) {
	_, runname, err := util.WaitForRun("", true, backend)
	if err != nil {
		return "", err
	}

	c, _, err := backend.StreamQueueStats(runname, qstat.Options{Tail: int64(1000)})
	if err != nil {
		return strconv.Itoa(0), err
	}

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
