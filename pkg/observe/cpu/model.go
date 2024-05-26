package cpu

import (
	"lunchpail.io/pkg/observe"
	"sort"
)

type Worker struct {
	Name        string
	Component   observe.Component
	CpuUtil     float64
	MemoryBytes uint64
}

type Model struct {
	Workers []Worker
}

func (model *Model) HasData() bool {
	return len(model.Workers) > 0
}

func (model *Model) Sorted() []Worker {
	w := []Worker{}
	for _, worker := range model.Workers {
		w = append(w, worker)
	}

	sort.Slice(w, func(i, j int) bool { return w[i].CpuUtil > w[j].CpuUtil })
	return w
}
