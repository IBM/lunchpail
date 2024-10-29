package qstat

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"

	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/observe/queuestreamer"
)

// renderer.render() Assists UI() in rendering the content of a given queuestreamer.Model
type renderer struct {
	queue.RunContext
	re           *lipgloss.Renderer
	highlight    lipgloss.Color
	italic       lipgloss.Style
	columnStyles []lipgloss.Style
}

func newRenderer(run queue.RunContext) renderer {
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

	return renderer{run, re, highlight, italic, styles}
}

func (r renderer) workerRow(t *table.Table, worker queuestreamer.Worker, suffix string) {
	t.Row(
		worker.Pool,
		r.name(worker.Pool, worker.Name)+suffix,
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

func (r renderer) name(pool, worker string) string {
	return strings.Replace(
		strings.Replace(worker, r.RunContext.RunName+"-", "", 1),
		pool+"-", "", 1,
	)
}
