package qstat

import (
	"fmt"
	"strconv"
	"strings"
)

type QlastOptions struct {
	Namespace string
}

func Qlast(marker, opt string, opts QlastOptions) (string, error) {
	c, _, err := QstatStreamer(Options{opts.Namespace, false, int64(1000), false})
	if err != nil {
		return strconv.Itoa(0), err
	}

	var lastmodel QstatModel
	for model := range c {
		lastmodel = model
	}

	if lastmodel.Valid {
		switch marker {
		case "unassigned":
			return strconv.Itoa(lastmodel.Unassigned), nil
		case "liveworkers":
			return strconv.Itoa(len(lastmodel.LiveWorkers)), nil
		case "success":
			return strconv.Itoa(lastmodel.Success), nil
		case "failure":
			return strconv.Itoa(lastmodel.Failure), nil
		case "liveworker.success":
			if opt != "" {
				// the request was for a particular worker index
				workeridx, err := strconv.Atoi(opt)
				if err != nil {
					return strconv.Itoa(0), err
				} else if workeridx < 0 || workeridx > len(lastmodel.LiveWorkers)-1 {
					// no such worker, yet
					return strconv.Itoa(0), nil
				} else {
					return strconv.Itoa(lastmodel.LiveWorkers[workeridx].Outbox), nil
				}
			} else {
				// otherwise, the request was for all workers
				vals := []int{}
				for _, worker := range lastmodel.LiveWorkers {
					vals = append(vals, worker.Outbox)
				}

				// turns an array [1,2,3] into a string "1 2 3", i.e. the delimeter is " "
				// and we trim off the surrounding brackets
				delim := " "
				return strings.Trim(strings.Join(strings.Fields(fmt.Sprint(vals)), delim), "[]"), nil
			}
		}
	}

	return strconv.Itoa(0), nil
}
