package shell

import (
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(compilationName, runname string, app hlir.Application, ir llir.LLIR, opts compilation.Options, verbose bool) (llir.Component, error) {
	var component lunchpail.Component
	switch app.Spec.Role {
	case "worker":
		component = lunchpail.WorkersComponent
	default:
		component = lunchpail.DispatcherComponent
	}

	return LowerAsComponent(compilationName, runname, app, ir, llir.ShellComponent{Component: component}, opts, verbose)
}

func LowerAsComponent(compilationName, runname string, app hlir.Application, ir llir.LLIR, component llir.ShellComponent, opts compilation.Options, verbose bool) (llir.Component, error) {
	component.Application = app
	if component.Sizing.Workers == 0 {
		component.Sizing = api.ApplicationSizing(app, opts)
	}
	if component.QueuePrefixPath == "" {
		component.QueuePrefixPath = api.QueuePrefixPath(ir.Queue, runname)
	}
	if component.InstanceName == "" {
		component.InstanceName = runname
	}

	return component, nil
}
