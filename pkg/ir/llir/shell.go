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

	// Defaults to run name
	InstanceName string

	// Where runners of this instance should pick up or dispatch queue data
	QueuePrefixPath string

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

func (c ShellComponent) WithInstanceNameSuffix(suffix string) ShellComponent {
	c.InstanceName = c.InstanceName + suffix
	return c
}
