package events

import (
	comp "lunchpail.io/pkg/lunchpail"
)

func ComponentShortName(c comp.Component) string {
	switch c {
	case comp.WorkersComponent:
		return "Workers"
	case comp.DispatcherComponent:
		return "Dispatch"
	case comp.WorkStealerComponent:
		return "Runtime"
	default:
		return string(c)
	}
}
