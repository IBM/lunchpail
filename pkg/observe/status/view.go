package status

import (
	"fmt"
	"io"
	"strconv"

	"github.com/charmbracelet/bubbles/table"

	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/observe/colors"
)

func padRight(str string, availableSpace int) string {
	return fmt.Sprintf("%-*s", max(0, availableSpace-(len(str)-1)), str)
}

func cellt(N, largestN, maxcells int, box Box) string {
	// for some reason, len(taskCells(N)) != N; probably unicode issues
	Nstr := strconv.Itoa(N)
	Nstrp := padRight(Nstr, len(strconv.Itoa(largestN))) // padded
	Ncells := min(N, maxcells)
	return colors.Brown.Render(Nstrp + " " + taskCells(Ncells, box))
}

func cellf(num, denom int, status events.WorkerStatus) string {
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
	return statusRow{table.Row{col1, col2}, nil, false}
}

func rowp(col1, col2 string, pool *Pool) statusRow {
	return statusRow{table.Row{col1, col2}, pool, false}
}

func rowPools(numPools int) statusRow {
	col1 := colors.Bold.Render("└─ Pools")
	col2 := colors.Blue.Render(strconv.Itoa(numPools))
	return statusRow{table.Row{col1, col2}, nil, true}
}

type statusRow struct {
	row        table.Row
	pool       *Pool
	isPoolsRow bool
}

func rows(model Model, maxwidth int, maxheight int, summary bool) ([]statusRow, int, []string) {
	runningDispatcher, totalDispatcher := model.split(model.Dispatcher)
	runningWorkStealer, totalWorkStealer := model.split(model.WorkStealer)

	barsandpadding := 4
	col1Width := 22 // TODO
	maxbox := min(model.maxbox(), maxwidth-col1Width-barsandpadding)
	timestamp := model.last()

	rows := []statusRow{
		row("App", colors.Blue.Render(model.AppName)),
		row("Run", colors.Blue.Render(model.RunName)),
		row("├─ Runtime", cellf(runningWorkStealer, totalWorkStealer, model.WorkStealer)),
		row("├─ "+colors.Bold.Render("Dispatch"), cellf(runningDispatcher, totalDispatcher, model.Dispatcher)),
	}

	if !summary {
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
			if failures > 0 {
				rows = append(rows, row(prefix2+"  └─ Failures", cellt(failures, largest, maxbox, boxFa)))
			}
		}
	}

	rows = append(rows, rowPools(model.numPools()))

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

			successTree := "└─"
			if failure > 0 {
				successTree = "├─"
			}

			rows = append(rows, row(prefix2+successTree+" Success", cellt(success, largest, maxbox, boxSu)))
			if failure > 0 {
				rows = append(rows, row(prefix2+"└─ Failures", cellt(failure, largest, maxbox, boxFa)))
			}
		}
	}

	linesOfPaddingAboveFooter := 1
	return rows, col1Width, footer(model, timestamp, maxwidth, max(0, maxheight-len(rows)-linesOfPaddingAboveFooter))
}
