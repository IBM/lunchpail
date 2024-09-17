package qstat

import (
	"context"
	"fmt"
	"os"
	"strconv"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
	"golang.org/x/term"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/runs/util"
)

type Options = qstat.Options

func UI(ctx context.Context, runnameIn string, backend be.Backend, opts Options) error {
	runname, err := util.WaitForRun(ctx, runnameIn, true, backend)
	if err != nil {
		return err
	}

	c, err := backend.Streamer(ctx, runname).QueueStats(opts)
	if err != nil {
		return err
	}

	purple := lipgloss.Color("99")
	re := lipgloss.NewRenderer(os.Stdout)
	headerStyle := re.NewStyle().Foreground(purple).Bold(true).Align(lipgloss.Center)

	first := true
	for model := range c {
		if !first {
			fmt.Println()
		} else {
			first = false
		}

		width, _, err := term.GetSize(1)
		if err != nil {
			return err
		}

		t := table.New().
			Border(lipgloss.NormalBorder()).
			BorderStyle(lipgloss.NewStyle().Foreground(purple)).
			Width(width).
			Headers("", "IDLE", "WORKING", "SUCCESS", "FAILURE").
			StyleFunc(func(row, col int) lipgloss.Style {
				var style lipgloss.Style

				switch {
				case row == 0:
					return headerStyle
				}
				return style
			})

		t.Row("unassigned", strconv.Itoa(model.Unassigned), "", "", "")
		t.Row("assigned", strconv.Itoa(model.Assigned), "", "", "")
		t.Row("processing", "", strconv.Itoa(model.Processing), "", "")
		t.Row("done", "", "", strconv.Itoa(model.Success), strconv.Itoa(model.Failure))

		for _, pool := range model.Pools {
			for _, worker := range pool.LiveWorkers {
				t.Row(worker.Name, strconv.Itoa(worker.Inbox), strconv.Itoa(worker.Processing), strconv.Itoa(worker.Outbox), strconv.Itoa(worker.Errorbox))
			}
			for _, worker := range pool.DeadWorkers {
				t.Row(worker.Name+"☠", strconv.Itoa(worker.Inbox), strconv.Itoa(worker.Processing), strconv.Itoa(worker.Outbox), strconv.Itoa(worker.Errorbox))
			}
		}

		fmt.Printf("%s\tWorkers: %d\n", model.Timestamp, model.LiveWorkers())
		fmt.Println(t)
	}

	return nil
}
