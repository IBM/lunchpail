package status

import (
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"
)

func rspacex(str string, actualSpace, availableSpace int) string {
	// - 2 as availableSpace includes one space character on either side
	return str + strings.Repeat(" ", max(0, availableSpace-actualSpace-2))
}

func rspace(str string, availableSpace int) string {
	return rspacex(str, len(str), availableSpace)
}

func rspacei(N int, availableSpace int) string {
	return rspace(strconv.Itoa(N), availableSpace)
}

func rspacet(N int, box Box, availableSpace int) string {
	// for some reason, len(taskCells(N)) != N; probably unicode issues
	Nstr := strconv.Itoa(N)
	return purple.Render(rspacex(Nstr+" "+taskCells(N, box), len(Nstr)+1+N, availableSpace))
}

func rspacef(num, denom int, str string, availableSpace int) string {
	fullstr := fmt.Sprintf("%d/%d %s", num, denom, str)
	return rspace(fullstr, availableSpace)
}

func rspacef1(num, denom int, status WorkerStatus, availableSpace int) string {
	frac := fmt.Sprintf("%d/%d", num, denom)
	fullstr := fmt.Sprintf("%s %s", frac, statusCell(status))
	return rspacex(fullstr, len(frac)+2, availableSpace) // +1 for cell, +1 for space
}

func rspacefw(num, denom int, workers []Worker, availableSpace int) string {
	frac := fmt.Sprintf("%d/%d", num, denom)
	fullstr := fmt.Sprintf("%s %s", frac, workerStatusCells(workers))
	return rspacex(fullstr, len(frac)+2, availableSpace)
}

func clearScreen(writer io.Writer) {
	fmt.Fprintf(writer, "\x1b[2J\x1b[H")
}

func clearLine(writer io.Writer) {
	fmt.Fprintf(writer, "\033[1A\033[K")
}

func row(col1, col2 string) {
	fmt.Printf("│ %-22s │ %s │\n", bold.Render(col1), col2)
}

func view(model Model, summary bool) {
	runningWorkers, totalWorkers := model.workersSplit()
	runningRuntime, totalRuntime := model.split(model.Runtime)
	runningInternalS3, totalInternalS3 := model.split(model.InternalS3)
	runningWorkStealer, totalWorkStealer := model.split(model.WorkStealer)

	maxbox := model.maxbox()

	// 2 = 1 for left pad, 1 for right pad
	// 4 = 1 for left pad, 1 for right pad, 1 for space between fraction and cells, 1 for fraction slash,
	nrightbars := max(
		8,
		2+len(model.AppName),
		2+len(model.RunName),
		4+totalWorkers+len(strconv.Itoa(runningWorkers))+len(strconv.Itoa(totalWorkers)),
		3+len(strconv.Itoa(maxbox))+maxbox,
	)
	rightbars := strings.Repeat(
		"─",
		nrightbars,
	)
	leftbars := "────────────────"
	topdiv := "┌" + leftbars + "┬" + rightbars + "┐"
	middiv := "│" + leftbars + "┼" + rightbars + "│"
	botdiv := "└" + leftbars + "┴" + rightbars + "┘"

	timestamp := model.LastEvent.Timestamp
	if timestamp.IsZero() {
		timestamp = time.Now()
	}

	fmt.Printf(" %s\n", dim.Render(timestamp.Format(time.RFC850)))
	fmt.Println(topdiv)
	row("App", cyan.Render(rspace(model.AppName, nrightbars)))
	row("Run", cyan.Render(rspace(model.RunName, nrightbars)))
	fmt.Println(middiv)
	row("Runtime", rspacef1(runningRuntime+runningWorkStealer, totalRuntime+totalWorkStealer, model.Runtime, nrightbars))

	row("Queue", rspacef1(runningInternalS3, totalInternalS3, model.InternalS3, nrightbars))
	if !summary && runningInternalS3 > 0 {
		pre := "  ├ "
		if len(model.Pools) <= 1 {
			pre = "  └ "
		}
		row(pre+"Unassigned", rspacet(model.Qstat.Unassigned, boxIn, nrightbars))

		if len(model.Pools) > 1 {
			row("  ├ Assigned", rspacet(model.allInbox(), boxIn, nrightbars))
			row("  ├ Processing", rspacet(model.Qstat.Processing, boxPr, nrightbars))
			row("  ├ Success", rspacet(model.Qstat.Success, boxSu, nrightbars))
			row("  └ Failures", rspacet(model.Qstat.Failure, boxFa, nrightbars))
		}
	}

	fmt.Println(middiv)

	row("Pools", cyan.Render(rspacei(model.numPools(), nrightbars)))

	for poolIdx, pool := range model.Pools {
		runningWorkers, totalWorkers := pool.workersSplit()
		row(
			"Pool "+strconv.Itoa(poolIdx+1), // TODO pool.Name
			rspacefw(runningWorkers, totalWorkers, pool.Workers, nrightbars),
		)

		if !summary {
			inbox, processing, success, failure := pool.qsummary()
			row("  ├ Inbox", rspacet(inbox, boxIn, nrightbars))
			row("  ├ Processing", rspacet(processing, boxPr, nrightbars))
			row("  ├ Success", rspacet(success, boxSu, nrightbars))
			row("  └ Failures", rspacet(failure, boxFa, nrightbars))
		}
	}
	fmt.Println(botdiv)

	if model.LastEvent.Message != "" {
		fmt.Println(dim.Render(model.LastEvent.Message))
	}
}
