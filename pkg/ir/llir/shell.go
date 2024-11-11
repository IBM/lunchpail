package llir

import (
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
)

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

	// Sizing of this instance
	Sizing RunSizeConfig
}

// part of llir.Component interface
func (c ShellComponent) C() lunchpail.Component {
	return c.Component
}

// part of llir.Component interface
func (c ShellComponent) Workers() int {
	return c.Sizing.Workers
}

func (c ShellComponent) SetWorkers(w int) Component {
	c.Sizing.Workers = w
	return c // FIXME
}

func (c ShellComponent) WithInstanceName(name string) ShellComponent {
	c.InstanceName = name
	return c
}

func (c ShellComponent) WithInstanceNameSuffix(suffix string) ShellComponent {
	return c.WithInstanceName(c.InstanceName + suffix)
}
