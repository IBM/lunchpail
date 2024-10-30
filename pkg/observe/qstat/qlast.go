package qstat

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/observe/queuestreamer"
)

type QlastOptions struct {
}

func Qlast(ctx context.Context, marker, opt string, backend be.Backend, opts QlastOptions) (string, error) {
	run, modelChan, doneChan, _, err := stream(ctx, "", backend, Options{})
	if err != nil {
		return "", err
	}
	defer close(doneChan)

	var lastmodel queuestreamer.Step
	for model := range modelChan {
		lastmodel = model.Steps[run.Step]
		break
	}

	switch marker {
	case "unassigned":
		return strconv.Itoa(len(lastmodel.UnassignedTasks)), nil
	case "liveworkers":
		return strconv.Itoa(len(lastmodel.LiveWorkers)), nil
	case "workers":
		return strconv.Itoa(len(lastmodel.LiveWorkers) + len(lastmodel.DeadWorkers)), nil
	case "processing":
		return strconv.Itoa(len(lastmodel.ProcessingTasks)), nil
	case "success":
		return strconv.Itoa(len(lastmodel.SuccessfulTasks)), nil
	case "failure":
		return strconv.Itoa(len(lastmodel.FailedTasks)), nil
	case "worker.success":
		vals := []uint{}
		for _, worker := range lastmodel.LiveWorkers {
			vals = append(vals, worker.NSuccess)
		}
		for _, worker := range lastmodel.DeadWorkers {
			vals = append(vals, worker.NSuccess)
		}

		// turns an array [1,2,3] into a string "1 2 3", i.e. the delimeter is " "
		// and we trim off the surrounding brackets
		delim := " "
		return strings.Trim(strings.Join(strings.Fields(fmt.Sprint(vals)), delim), "[]"), nil
	}

	return strconv.Itoa(0), nil
}
