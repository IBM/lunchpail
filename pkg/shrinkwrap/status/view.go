package status

import (
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/charmbracelet/bubbles/table"
	"lunchpail.io/pkg/views"
)

func padRight(str string, availableSpace int) string {
	return fmt.Sprintf("%-*s", max(0, availableSpace-(len(str)-1)), str)
}

func cellt(N, largestN, maxcells int, box Box) string {
	// for some reason, len(taskCells(N)) != N; probably unicode issues
	Nstr := strconv.Itoa(N)
	Nstrp := padRight(Nstr, len(strconv.Itoa(largestN))) // padded
	Ncells := min(N, maxcells)
	return views.Brown.Render(Nstrp + " " + taskCells(Ncells, box))
}

func cellf(num, denom int, status WorkerStatus) string {
	frac := fmt.Sprintf("%d/%d", num, denom)
	return fmt.Sprintf("%s %s", frac, statusCell(status))
}

func cellfw(num, denom int, workers []Worker) string {
	frac := fmt.Sprintf("%d/%d", num, denom)
	return fmt.Sprintf("%s %s", frac, workerStatusCells(workers))
}

func clearLine(writer io.Writer) {
	fmt.Fprintf(writer, "\033[1A\033[K")
}

func row(col1, col2 string) statusRow {
	return statusRow{table.Row{col1, col2}, nil}
}

func rowp(col1, col2 string, pool *Pool) statusRow {
	return statusRow{table.Row{col1, col2}, pool}
}

type statusRow struct {
	row  table.Row
	pool *Pool
}

func rows(model Model, maxwidth int, maxheight int, summary bool) ([]statusRow, int, []string) {
	runningRuntime, totalRuntime := model.split(model.Runtime)
	runningInternalS3, totalInternalS3 := model.split(model.InternalS3)
	runningDispatcher, totalDispatcher := model.split(model.Dispatcher)
	runningWorkStealer, totalWorkStealer := model.split(model.WorkStealer)

	barsandpadding := 4
	col1Width := 22 // TODO
	maxbox := min(model.maxbox(), maxwidth-col1Width-barsandpadding)
	timestamp := model.last()

	rows := []statusRow{
		row("App", views.Blue.Render(model.AppName)),
		row("Run", views.Blue.Render(model.RunName)),
		row("├─ Runtime", cellf(runningRuntime+runningWorkStealer, totalRuntime+totalWorkStealer, model.Runtime)),
		row("├─ "+views.Bold.Render("Dispatcher"), cellf(runningDispatcher, totalDispatcher, model.Dispatcher)),
		row("├─ "+views.Bold.Render("Queue"), cellf(runningInternalS3, totalInternalS3, model.InternalS3)),
	}

	if !summary && runningInternalS3 > 0 {
		prefix := "  ├─ "
		prefix2 := "│"
		if len(model.Pools) <= 1 {
			prefix = "  └─ "
		}

		unassigned := model.Qstat.Unassigned
		inbox := model.allInbox()
		processing := model.Qstat.Processing
		success := model.Qstat.Success
		failures := model.Qstat.Failure
		largest := max(unassigned, inbox, processing, success, failures)
		rows = append(rows, row(prefix2+prefix+"Unassigned", cellt(unassigned, largest, maxbox, boxIn)))

		if len(model.Pools) > 1 {
			rows = append(rows, row(prefix2+"  ├─ Assigned", cellt(inbox, largest, maxbox, boxIn)))
			rows = append(rows, row(prefix2+"  ├─ Processing", cellt(processing, largest, maxbox, boxPr)))
			rows = append(rows, row(prefix2+"  ├─ Success", cellt(success, largest, maxbox, boxSu)))
			rows = append(rows, row(prefix2+"  └─ Failures", cellt(failures, largest, maxbox, boxFa)))
		}
	}

	rows = append(rows, row(views.Bold.Render("└─ Pools"), views.Blue.Render(strconv.Itoa(model.numPools()))))

	for poolIdx, pool := range model.Pools {
		runningWorkers, totalWorkers := pool.workersSplit()
		prefix := "├─ "
		prefix2 := "   │  "
		if poolIdx == len(model.Pools)-1 {
			prefix = "└─ "
			prefix2 = "      "
		}
		rows = append(rows, rowp(
			"   "+prefix+"Pool "+strconv.Itoa(poolIdx+1), // TODO pool.Name
			cellfw(runningWorkers, totalWorkers, pool.Workers),
			&pool,
		))

		if !summary {
			inbox, processing, success, failure := pool.qsummary()
			largest := max(inbox, processing, success, failure)

			rows = append(rows, row(prefix2+"├─ Inbox", cellt(inbox, largest, maxbox, boxIn)))
			rows = append(rows, row(prefix2+"├─ Processing", cellt(processing, largest, maxbox, boxPr)))
			rows = append(rows, row(prefix2+"├─ Success", cellt(success, largest, maxbox, boxSu)))
			rows = append(rows, row(prefix2+"└─ Failures", cellt(failure, largest, maxbox, boxFa)))
		}
	}

	// display in reverse order, so that they are presented
	// temporally top to bottom
	footer := []string{timestamp.Format(time.RFC850)}
	// -2: normal -1, and -1 to leave at least one line of
	// whitespace between main `rows` and footer lines
	for _, msg := range model.messages(max(0, maxheight-len(rows)-2)) {
		footer = append(footer, message(msg.who, msg.message))
	}

	return rows, col1Width, footer
}

func message(who, message string) string {
	return fmt.Sprintf("%s %s", views.Dim.Render(views.Yellow.Render(who)), views.Dim.Render(message))
}
