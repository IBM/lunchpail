package qstat

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/bep/debounce"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/observe/queuestreamer"
)

type Options struct {
	queuestreamer.StreamOptions

	// Continue to track the output versus show just a one-time UI
	Follow bool

	// Debounce output with this granularity in milliseconds
	Debounce int
}

func UI(ctx context.Context, runnameIn string, backend be.Backend, opts Options) error {
	runname, modelChan, doneChan, group, err := stream(ctx, runnameIn, backend, opts)
	if err != nil {
		return err
	}
	defer close(doneChan)

	r := newRenderer(runname)

	// Debounce output to avoid quick flurries of UI output
	dbinterval := opts.Debounce
	if dbinterval == 0 {
		dbinterval = 1000
	}
	debounced := debounce.New(time.Duration(dbinterval) * time.Millisecond)

	// Consume model updates from channel `c` and render them to
	// the console as a table
	for model := range modelChan {
		if opts.Debug {
			fmt.Fprintln(os.Stderr, "Got model update", model)
		}

		debounced(func() { r.render(model) })

		if !opts.Follow {
			break
		}
	}

	if opts.Debug {
		fmt.Fprintln(os.Stderr, "Stopped receiving updates")
	}
	return group.Wait()
}

func name(runname, pool, worker string) string {
	return strings.Replace(
		strings.Replace(worker, runname+"-", "", 1),
		pool+"-", "", 1,
	)
}

type renderer struct {
	runname      string
	re           *lipgloss.Renderer
	highlight    lipgloss.Color
	italic       lipgloss.Style
	columnStyles []lipgloss.Style
}

func newRenderer(runname string) renderer {
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

	return renderer{runname, re, highlight, italic, styles}
}

func (r renderer) workerRow(t *table.Table, worker queuestreamer.Worker, suffix string) {
	t.Row(
		worker.Pool,
		name(r.runname, worker.Pool, worker.Name)+suffix,
		strconv.Itoa(len(worker.AssignedTasks)),
		strconv.Itoa(len(worker.ProcessingTasks)),
		strconv.FormatUint(uint64(worker.NSuccess), 10),
		strconv.FormatUint(uint64(worker.NFail), 10),
	)
}

func (r renderer) table() *table.Table {
	return table.New().
		Border(lipgloss.NormalBorder()).
		BorderStyle(lipgloss.NewStyle().Foreground(r.highlight)).
		Headers("Pool", "Worker", "Pend", "Live", "Done", "Fail").
		StyleFunc(func(row, col int) lipgloss.Style {
			switch {
			case row == -1: // header row
				return r.columnStyles[0]
			case row == 0: // inbox row
				if col > 2 {
					return r.columnStyles[0]
				}
			}
			return r.columnStyles[col]
		})
}

func (r renderer) render(model queuestreamer.Model) {
	t := r.table()
	t.Row("", r.italic.Render("inbox"), strconv.Itoa(len(model.UnassignedTasks)), "", "", "")

	// Numbers across all pools
	//t.Row("assigned", strconv.Itoa(model.Assigned), "", "", "")
	//t.Row("processing", "", strconv.Itoa(model.Processing), "", "")
	//t.Row("done", "", "", strconv.Itoa(model.Success), strconv.Itoa(model.Failure))

	for _, worker := range model.LiveWorkers {
		r.workerRow(t, worker, "")
	}
	for _, worker := range model.DeadWorkers {
		r.workerRow(t, worker, "☠")
	}

	// fmt.Printf("%s\tWorkers: %d\n", model.Timestamp, model.LiveWorkers())
	fmt.Println(t)
}
