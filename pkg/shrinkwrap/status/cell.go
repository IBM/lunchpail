package status

import "strings"

func statusCell(status WorkerStatus) string {
	style := yellow
	cell := "◔"

	switch status {
	case Running:
		style = green
		cell = "●"
	case Terminating:
		style = gray
		cell = "◌"
	case Failed:
		style = red
		cell = "◉"
	case Succeeded:
		style = cyan
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
