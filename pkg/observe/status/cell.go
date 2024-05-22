package status

import (
	"lunchpail.io/pkg/observe/colors"
	"strings"
)

func statusCell(status WorkerStatus) string {
	style := colors.Yellow
	cell := "◔"

	switch status {
	case Running:
		style = colors.Green
		cell = "●"
	case Terminating:
		style = colors.Gray
		cell = "◌"
	case Failed:
		style = colors.Red
		cell = "◉"
	case Succeeded:
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
