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
	prevNumRows  int
	highlight    lipgloss.Color
	italic       lipgloss.Style
	dead         lipgloss.Style
	columnStyles []lipgloss.Style
}

func newRenderer(run queue.RunContext) renderer {
	black := lipgloss.AdaptiveColor{Light: "#fff", Dark: "#000"}

	highlight := lipgloss.Color("#3C3C3C")
	re := lipgloss.NewRenderer(os.Stdout)
	italic := re.NewStyle().Italic(true)
	dead := re.NewStyle().Strikethrough(true)
	styles := []lipgloss.Style{
		re.NewStyle().Faint(true), // Step Index
		lipgloss.Style{},          // Pool
		lipgloss.Style{},          // Worker
		re.NewStyle().Bold(true).Background(lipgloss.Color("3")).Foreground(black).Padding(0, 1), // Pend
		re.NewStyle().Padding(0, 1), // Live
		re.NewStyle().Bold(true).Background(lipgloss.Color("2")).Foreground(black).Padding(0, 1), // Done
		re.NewStyle().Bold(true).Background(lipgloss.Color("1")).Foreground(black).Padding(0, 1), // Fail
	}

	return renderer{run, 0, highlight, italic, dead, styles}
}

func (r renderer) workerRow(stepIdx int, t *table.Table, worker queuestreamer.Worker, isAlive bool) {
	t.Row(
		strconv.Itoa(stepIdx),
		worker.Pool,
		r.name(worker.Pool, worker.Name, isAlive),
		strconv.Itoa(len(worker.AssignedTasks)),
		strconv.Itoa(len(worker.ProcessingTasks)),
		strconv.FormatUint(uint64(worker.NSuccess), 10),
		strconv.FormatUint(uint64(worker.NFail), 10),
	)
}

func (r renderer) isEmpty(model queuestreamer.Model) bool {
	for _, step := range model.Steps {
		if !r.isEmptyStep(step) {
			return false
		}
	}
	return true
}

func (r renderer) isEmptyStep(step queuestreamer.Step) bool {
	return !r.showInbox(step) && len(step.LiveWorkers) == 0 && len(step.DeadWorkers) == 0
}

func (r renderer) showInbox(step queuestreamer.Step) bool {
	return len(step.UnassignedTasks) > 0
}

func (r *renderer) render(t *table.Table) {
	if r.prevNumRows > 0 {
		reset := ""
		for range r.prevNumRows + 1 {
			reset += "\033[2K\r\033[1F" // 2K clears line; \r returns to beginning of line (maybe not needed); and 1F returns to previous line
		}
		fmt.Printf(reset)
	}
	s := t.Render()
	r.prevNumRows = strings.Count(s, "\n")
	fmt.Println(s)
}

func (r renderer) table(model queuestreamer.Model) *table.Table {
	rowIdx := 0
	inboxRows := make(map[int]bool)
	for _, step := range model.Steps {
		if r.showInbox(step) {
			inboxRows[rowIdx] = true
			rowIdx++
		}
		rowIdx += len(step.LiveWorkers) + len(step.DeadWorkers)
	}

	t := table.New().
		Border(lipgloss.NormalBorder()).
		BorderStyle(lipgloss.NewStyle().Foreground(r.highlight)).
		Headers("Step", "Pool", "Worker", "Pend", "Live", "Done", "Fail").
		StyleFunc(func(row, col int) lipgloss.Style {
			switch {
			case row == table.HeaderRow:
				return r.columnStyles[0]
			case inboxRows[row]:
				if col > 2 {
					return r.columnStyles[0]
				}
			}
			return r.columnStyles[col]
		})
	return t
}

func (r renderer) step(idx int, model queuestreamer.Step, t *table.Table) {
	// Numbers across all pools
	//t.Row("assigned", strconv.Itoa(model.Assigned), "", "", "")
	//t.Row("processing", "", strconv.Itoa(model.Processing), "", "")
	//t.Row("done", "", "", strconv.Itoa(model.Success), strconv.Itoa(model.Failure))

	if r.showInbox(model) {
		t.Row(strconv.Itoa(idx), r.italic.Render("queued"), "", strconv.Itoa(len(model.UnassignedTasks)), "", "", "")
	}

	for _, worker := range model.LiveWorkers {
		r.workerRow(idx, t, worker, true)
	}
	for _, worker := range model.DeadWorkers {
		r.workerRow(idx, t, worker, false)
	}
}

func (r renderer) name(pool, worker string, isAlive bool) string {
	label := strings.Replace(
		strings.Replace(worker, r.RunContext.RunName+"-", "", 1),
		pool+"-", "", 1,
	)

	if !isAlive {
		return r.dead.Render(label) + " ☠"
	}

	return label
}
