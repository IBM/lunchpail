package status

import (
	"lunchpail.io/pkg/views"
	"strings"
)

func statusCell(status WorkerStatus) string {
	style := views.Yellow
	cell := "◔"

	switch status {
	case Running:
		style = views.Green
		cell = "●"
	case Terminating:
		style = views.Gray
		cell = "◌"
	case Failed:
		style = views.Red
		cell = "◉"
	case Succeeded:
		style = views.Cyan
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
