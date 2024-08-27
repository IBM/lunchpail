package status

import (
	"strings"

	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/observe/colors"
)

func statusCell(status events.WorkerStatus) string {
	style := colors.Yellow
	cell := "◔"

	switch status {
	case events.Running:
		style = colors.Green
		cell = "●"
	case events.Terminating:
		style = colors.Gray
		cell = "◌"
	case events.Failed:
		style = colors.Red
		cell = "◉"
	case events.Succeeded:
		style = colors.Cyan
		cell = "○"
	}

	return style.Render(cell)
}

type Box string

const (
	boxIn Box = "inbox"
	boxPr     = "processing"
	boxSu     = "success"
	boxFa     = "failure"
)

func taskCells(N int, box Box) string {
	cell := "■"

	switch box {
	case boxIn:
		cell = "□"
	case boxPr:
		cell = "▨"
	case boxFa:
		cell = "▣"
	}

	return strings.Repeat(cell, N)
}

func workerStatusCells(workers []Worker) string {
	res := ""
	for _, worker := range workers {
		res += statusCell(worker.Status)
	}
	return res
}
