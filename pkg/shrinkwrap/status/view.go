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
	return brown.Render(Nstrp+" "+taskCells(Ncells, box))
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

func rows(model Model, maxwidth int, summary bool) ([]table.Row, []string) {
	runningWorkers, totalWorkers := model.workersSplit()
	runningRuntime, totalRuntime := model.split(model.Runtime)
	runningInternalS3, totalInternalS3 := model.split(model.InternalS3)
	runningWorkStealer, totalWorkStealer := model.split(model.WorkStealer)

	barsandpadding := 9
	nleftbars := 15 // TODO
	maxbox := min(model.maxbox(), maxwidth-nleftbars-barsandpadding)

	// 2 = 1 for left pad, 1 for right pad
	// 4 = 1 for left pad, 1 for right pad, 1 for space between fraction and cells, 1 for fraction slash,
	nrightbars := max(
		barsandpadding,
		2+len(model.AppName),
		2+len(model.RunName),
		4+totalWorkers+len(strconv.Itoa(runningWorkers))+len(strconv.Itoa(totalWorkers)),
		4+len(strconv.Itoa(maxbox))+maxbox,
	)
	rightbars := strings.Repeat("─", nrightbars)
	leftbars := strings.Repeat("─", nleftbars)
	// topdiv := "┌" + leftbars + "┬" + rightbars + "┐"
	// middiv := "│" + leftbars + "┼" + rightbars + "│"
	// botdiv := "└" + leftbars + "┴" + rightbars + "┘"
	// topdiv := table.Row{"┌" + leftbars + "┬", rightbars + "┐"}

	timestamp := time.Now()
	if event, ok := model.LastNEvents.Value.(Event); ok {
		lastEventTimestamp := event.Timestamp
		if !timestamp.IsZero() {
			timestamp = lastEventTimestamp
		}
	}

	rows := []table.Row{}
	header := timestamp.Format(time.RFC850)
	// rows = append(rows, topdiv)
	rows = append(rows, row("App", cyan.Render(model.AppName)))
	rows = append(rows, row("Run", cyan.Render(model.RunName)))
	rows = append(rows, row(leftbars, rightbars))
	rows = append(rows, row("Runtime", cellf(runningRuntime+runningWorkStealer, totalRuntime+totalWorkStealer, model.Runtime)))

	rows = append(rows, row("Queue", cellf(runningInternalS3, totalInternalS3, model.InternalS3)))
	if !summary && runningInternalS3 > 0 {
		pre := " ├ "
		if len(model.Pools) <= 1 {
			pre = " └ "
		}

		unassigned := model.Qstat.Unassigned
		inbox := model.allInbox()
		processing := model.Qstat.Processing
		success := model.Qstat.Success
		failures := model.Qstat.Failure
		largest := max(unassigned, inbox, processing, success, failures)
		rows = append(rows, row(pre+"Unassigned", cellt(unassigned, largest, maxbox, boxIn)))

		if len(model.Pools) > 1 {
			rows = append(rows, row(" ├ Assigned", cellt(inbox, largest, maxbox, boxIn)))
			rows = append(rows, row(" ├ Processing", cellt(processing, largest, maxbox, boxPr)))
			rows = append(rows, row(" ├ Success", cellt(success, largest, maxbox, boxSu)))
			rows = append(rows, row(" └ Failures", cellt(failures, largest, maxbox, boxFa)))
		}
	}

	rows = append(rows, row(leftbars, rightbars))

	rows = append(rows, row("Pools", cyan.Render(celli(model.numPools()))))

	for poolIdx, pool := range model.Pools {
		runningWorkers, totalWorkers := pool.workersSplit()
		rows = append(rows, row(
			"Pool "+strconv.Itoa(poolIdx+1), // TODO pool.Name
			cellfw(runningWorkers, totalWorkers, pool.Workers),
		))

		if !summary {
			inbox, processing, success, failure := pool.qsummary()
			largest := max(inbox, processing, success, failure)

			rows = append(rows, row(" ├ Inbox", cellt(inbox, largest, maxbox, boxIn)))
			rows = append(rows, row(" ├ Processing", cellt(processing, largest, maxbox, boxPr)))
			rows = append(rows, row(" ├ Success", cellt(success, largest, maxbox, boxSu)))
			rows = append(rows, row(" └ Failures", cellt(failure, largest, maxbox, boxFa)))
		}
	}
	// fmt.Println(botdiv)

	// display in reverse order, so that they are presented
	// temporally top to bottom
	footer := []string{header}
	events := model.events()
	for i := range events {
		footer = append(footer, dim.Render(events[len(events)-i-1].Message))
	}

	return rows, footer
}
