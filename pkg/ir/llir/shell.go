package llir

import (
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
)

// One Component for WorkStealer, one for Dispatcher, and each per WorkerPool
type ShellComponent struct {
	hlir.Application

	// Which lunchpail component is this part of
	lunchpail.Component

	// Use a Job-style (versus Pod-style) of deployment?
	RunAsJob bool

	// Identifies this component instance
	InstanceName string

	// Identifies the group this component is part of, e.g. the original name of the workerpool (i.e. without run id, component, ...)
	GroupName string

	// Initial number of workers to use
	InitialWorkers int

	// Sizing of this instance
	MinMemoryBytes uint64
}

// part of llir.Component interface
func (c ShellComponent) C() lunchpail.Component {
	return c.Component
}

// part of llir.Component interface
func (c ShellComponent) Workers() int {
	return c.InitialWorkers
}

func (c ShellComponent) SetWorkers(w int) ShellComponent {
	c.InitialWorkers = w
	return c // FIXME
}

func (c ShellComponent) WithInstanceName(name string) ShellComponent {
	c.InstanceName = name
	return c
}

func (c ShellComponent) WithInstanceNameSuffix(suffix string) ShellComponent {
	return c.WithInstanceName(c.InstanceName + suffix)
}
