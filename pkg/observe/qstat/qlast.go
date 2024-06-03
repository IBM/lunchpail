package qstat

import (
	"fmt"
	"lunchpail.io/pkg/observe/runs"
	"strconv"
	"strings"
)

type QlastOptions struct {
	Namespace string
}

func Qlast(marker, opt string, opts QlastOptions) (string, error) {
	_, runname, namespace, err := runs.WaitForRun("", opts.Namespace, true)
	if err != nil {
		return "", err
	}

	c, _, err := QstatStreamer(runname, namespace, Options{namespace, false, int64(1000), false, false})
	if err != nil {
		return strconv.Itoa(0), err
	}

	var lastmodel Model
	for model := range c {
		lastmodel = model
	}

	if lastmodel.Valid {
		switch marker {
		case "unassigned":
			return strconv.Itoa(lastmodel.Unassigned), nil
		case "liveworkers":
			return strconv.Itoa(lastmodel.liveWorkers()), nil
		case "workers":
			return strconv.Itoa(lastmodel.workers()), nil
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
