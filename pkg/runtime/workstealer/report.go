package workstealer

import (
	"fmt"
	"os"
	"text/tabwriter"
	"time"
)

// Record the current state of Model for observability
func (model Model) report() {
	now := time.Now()
	writer := tabwriter.NewWriter(os.Stderr, 0, 8, 1, '\t', tabwriter.AlignRight)

	fmt.Fprintf(writer, "lunchpail.io\tunassigned\t%d\t\t\t\t\t%s\t%s\n", len(model.UnassignedTasks), run, now.Format(time.UnixDate))
	fmt.Fprintf(writer, "lunchpail.io\tdispatcherDone\t%v\t\t\t\t\t%s\n", model.DispatcherDone, run)
	fmt.Fprintf(writer, "lunchpail.io\tassigned\t%d\t\t\t\t\t%s\n", len(model.AssignedTasks), run)
	fmt.Fprintf(writer, "lunchpail.io\tprocessing\t\t%d\t\t\t\t%s\n", len(model.ProcessingTasks), run)
	fmt.Fprintf(writer, "lunchpail.io\tdone\t\t\t%d\t%d\t\t%s\n", len(model.SuccessfulTasks), len(model.FailedTasks), run)
	fmt.Fprintf(writer, "lunchpail.io\tliveworkers\t%d\t\t\t\t\t%s\n", len(model.LiveWorkers), run)
	fmt.Fprintf(writer, "lunchpail.io\tdeadworkers\t%d\t\t\t\t\t%s\n", len(model.DeadWorkers), run)

	for _, worker := range model.LiveWorkers {
		fmt.Fprintf(
			writer, "lunchpail.io\tliveworker\t%d\t%d\t%d\t%d\t%s\t%s\t%v\n",
			len(worker.assignedTasks), len(worker.processingTasks), worker.nSuccess, worker.nFail, worker.name, run, worker.killfilePresent,
		)
	}
	for _, worker := range model.DeadWorkers {
		fmt.Fprintf(
			writer, "lunchpail.io\tdeadworker\t%d\t%d\t%d\t%d\t%s\t%s\n",
			len(worker.assignedTasks), len(worker.processingTasks), worker.nSuccess, worker.nFail, worker.name, run,
		)
	}
	fmt.Fprintf(writer, "lunchpail.io\t---\n")

	writer.Flush()
}
