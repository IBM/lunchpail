package llir

import "lunchpail.io/pkg/lunchpail"

type ShellComponent struct {
	// Which lunchpail component is this part of
	lunchpail.Component

	// Use a Job-style (versus Pod-style) of deployment?
	RunAsJob bool

	// Defaults to run name
	InstanceName string

	// DashDashSet Values (temporarily here)
	Values []string

	// Environment variables
	Env map[string]string

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
