package cpu

import "lunchpail.io/pkg/lunchpail"

type Worker struct {
	Name      string
	Component lunchpail.Component
	CpuUtil   float64
}

type Model struct {
	Workers []Worker
}
