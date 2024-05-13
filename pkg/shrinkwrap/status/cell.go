package status

import "strings"

func statusCell(status WorkerStatus) string {
	style := green
	switch status {
	case Pending:
	case Booting:
		style = yellow
	case Terminating:
		style = gray
	case Failed:
		style = red
	case Succeeded:
		style = cyan
	}

	return style.Render("●")
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
