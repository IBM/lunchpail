package qstat

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/ir/queue"
)

type Options = qstat.Options

func UI(ctx context.Context, runnameIn string, backend be.Backend, opts Options) error {
	runname, err := util.WaitForRun(ctx, runnameIn, true, backend)
	if err != nil {
		return err
	}

	// Start streaming qstat models into channel `c`
	c := make(chan qstat.Model)
	go func() {
		defer close(c)
		if err := backend.Streamer(ctx, queue.RunContext{RunName: runname}).QueueStats(c, opts); err != nil {
			fmt.Fprintf(os.Stderr, "Error from streamer: %v\n", err)
		}
	}()

	highlight := lipgloss.Color("#3C3C3C")
	re := lipgloss.NewRenderer(os.Stdout)
	italic := re.NewStyle().Italic(true)
	styles := []lipgloss.Style{
		lipgloss.Style{}, // Pool
		lipgloss.Style{}, // Worker
		re.NewStyle().Bold(true).Background(lipgloss.Color("3")).Padding(0, 1), // Pend
		re.NewStyle().Padding(0, 1), // Live
		re.NewStyle().Bold(true).Background(lipgloss.Color("2")).Padding(0, 1), // Done
		re.NewStyle().Bold(true).Background(lipgloss.Color("1")).Padding(0, 1), // Fail
	}

	workerRow := func(t *table.Table, pool qstat.Pool, worker qstat.Worker, suffix string) {
		t.Row(
			pool.Name,
			name(runname, pool.Name, worker.Name)+suffix,
			strconv.Itoa(worker.Inbox),
			strconv.Itoa(worker.Processing),
			strconv.Itoa(worker.Outbox),
			strconv.Itoa(worker.Errorbox),
		)
	}

	// Consume model updates from channel `c` and render them to
	// the console as a table
	for model := range c {
		t := table.New().
			Border(lipgloss.NormalBorder()).
			BorderStyle(lipgloss.NewStyle().Foreground(highlight)).
			Headers("Pool", "Worker", "Pend", "Live", "Done", "Fail").
			StyleFunc(func(row, col int) lipgloss.Style {
				switch {
				case row == -1: // header row
					return styles[0]
				case row == 0: // inbox row
					if col > 2 {
						return styles[0]
					}
				}
				return styles[col]
			})

		t.Row("", italic.Render("inbox"), strconv.Itoa(model.Unassigned), "", "", "")

		// Numbers across all pools
		//t.Row("assigned", strconv.Itoa(model.Assigned), "", "", "")
		//t.Row("processing", "", strconv.Itoa(model.Processing), "", "")
		//t.Row("done", "", "", strconv.Itoa(model.Success), strconv.Itoa(model.Failure))

		for _, pool := range model.Pools {
			for _, worker := range pool.LiveWorkers {
				workerRow(t, pool, worker, "")
			}
			for _, worker := range pool.DeadWorkers {
				workerRow(t, pool, worker, "☠")
			}
		}

		// fmt.Printf("%s\tWorkers: %d\n", model.Timestamp, model.LiveWorkers())
		fmt.Println(t)
	}

	return nil
}

func name(runname, pool, worker string) string {
	return strings.Replace(
		strings.Replace(worker, runname+"-", "", 1),
		pool+"-", "", 1,
	)
}
