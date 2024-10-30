package workstealer

import (
	"bytes"
	"fmt"
	"text/tabwriter"
	"time"

	"lunchpail.io/pkg/observe/queuestreamer"
)

// Record the current state of Model for observability
func (c client) report(m queuestreamer.Step) error {
	now := time.Now()

	var b bytes.Buffer
	writer := tabwriter.NewWriter(&b, 0, 8, 1, '\t', tabwriter.AlignRight)

	fmt.Fprintf(writer, "lunchpail.io\tunassigned\t%d\t\t\t\t\t%s\t%s\n", len(m.UnassignedTasks), c.RunContext.RunName, now.Format(time.UnixDate))
	fmt.Fprintf(writer, "lunchpail.io\tdispatcherDone\t%v\t\t\t\t\t%s\n", m.DispatcherDone, c.RunContext.RunName)
	fmt.Fprintf(writer, "lunchpail.io\tassigned\t%d\t\t\t\t\t%s\n", len(m.AssignedTasks), c.RunContext.RunName)
	fmt.Fprintf(writer, "lunchpail.io\tprocessing\t\t%d\t\t\t\t%s\n", len(m.ProcessingTasks), c.RunContext.RunName)
	fmt.Fprintf(writer, "lunchpail.io\toutbox\t\t\t%d\t\t\t%s\n", len(m.OutboxTasks), c.RunContext.RunName)
	fmt.Fprintf(writer, "lunchpail.io\tdone\t\t\t%d\t%d\t\t%s\n", len(m.SuccessfulTasks), len(m.FailedTasks), c.RunContext.RunName)
	fmt.Fprintf(writer, "lunchpail.io\tliveworkers\t%d\t\t\t\t\t%s\n", len(m.LiveWorkers), c.RunContext.RunName)
	fmt.Fprintf(writer, "lunchpail.io\tdeadworkers\t%d\t\t\t\t\t%s\n", len(m.DeadWorkers), c.RunContext.RunName)

	for _, worker := range m.LiveWorkers {
		fmt.Fprintf(
			writer, "lunchpail.io\tliveworker\t%d\t%d\t%d\t%d\t%s/%s\t%s\t%v\n",
			len(worker.AssignedTasks), len(worker.ProcessingTasks), worker.NSuccess, worker.NFail, worker.Pool, worker.Name, c.RunContext.RunName, worker.KillfilePresent,
		)
	}
	for _, worker := range m.DeadWorkers {
		fmt.Fprintf(
			writer, "lunchpail.io\tdeadworker\t%d\t%d\t%d\t%d\t%s/%s\t%s\n",
			len(worker.AssignedTasks), len(worker.ProcessingTasks), worker.NSuccess, worker.NFail, worker.Pool, worker.Name, c.RunContext.RunName,
		)
	}
	fmt.Fprintln(writer, "lunchpail.io\t---")

	writer.Flush()

	// for now, also log to stdout
	fmt.Printf(b.String())

	// and write to the log file
	/*if err := os.MkdirAll(logDir, 0700); err != nil {
		return err
	}
	logFile := filepath.Join(logDir, "qstat.txt")
	f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	if _, err := b.WriteTo(f); err != nil {
		return err
	}

	return c.reportChangedFile(logFile)*/
	return nil
}
