package status

import (
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/table"
)

func rspacex(str string, actualSpace, availableSpace int) string {
	// - 2 as availableSpace includes one space character on either side
	return str + strings.Repeat(" ", max(0, availableSpace-actualSpace-2))
}

func rspace(str string, availableSpace int) string {
	return rspacex(str, len(str), availableSpace)
}

func celli(N int) string {
	return strconv.Itoa(N)
}

func cellt(N, largestN, maxcells int, box Box) string {
	// for some reason, len(taskCells(N)) != N; probably unicode issues
	Nstr := strconv.Itoa(N)
	Nstrp := rspace(Nstr, len(strconv.Itoa(largestN))+2) // padded
	Ncells := min(N, maxcells)
	return brown.Render(Nstrp + " " + taskCells(Ncells, box))
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

func row(col1, col2 string) table.Row {
	return table.Row{col1, col2}
}

func rows(model Model, maxwidth int, summary bool) ([]table.Row, int, []string) {
	runningRuntime, totalRuntime := model.split(model.Runtime)
	runningInternalS3, totalInternalS3 := model.split(model.InternalS3)
	runningWorkStealer, totalWorkStealer := model.split(model.WorkStealer)

	barsandpadding := 4
	col1Width := 22 // TODO
	maxbox := min(model.maxbox(), maxwidth-col1Width-barsandpadding)

	timestamp := time.Now()
	if event, ok := model.LastNEvents.Value.(Event); ok {
		lastEventTimestamp := event.Timestamp
		if !timestamp.IsZero() {
			timestamp = lastEventTimestamp
		}
	}

	rows := []table.Row{
		row("App", cyan.Render(model.AppName)),
		row("Run", cyan.Render(model.RunName)),
		row("├─ "+bold.Render("Runtime"), cellf(runningRuntime+runningWorkStealer, totalRuntime+totalWorkStealer, model.Runtime)),
		row("├─ "+bold.Render("Queue"), cellf(runningInternalS3, totalInternalS3, model.InternalS3)),
	}

	if !summary && runningInternalS3 > 0 {
		prefix := "  ├─ "
		prefix2 := "│"
		if len(model.Pools) <= 1 {
			prefix = "  └─"
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

	rows = append(rows, row(bold.Render("└─ Pools"), cyan.Render(celli(model.numPools()))))

	for poolIdx, pool := range model.Pools {
		runningWorkers, totalWorkers := pool.workersSplit()
		prefix := "├─ "
		prefix2 := "   │  "
		if poolIdx == len(model.Pools)-1 {
			prefix = "└─ "
			prefix2 = "      "
		}
		rows = append(rows, row(
			"   "+prefix+"Pool "+strconv.Itoa(poolIdx+1), // TODO pool.Name
			cellfw(runningWorkers, totalWorkers, pool.Workers),
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
	events := model.events()
	for i := range events {
		footer = append(footer, dim.Render(events[len(events)-i-1].Message))
	}

	return rows, col1Width, footer
}
