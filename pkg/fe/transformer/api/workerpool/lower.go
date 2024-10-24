package workerpool

import (
	"fmt"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(buildName string, ctx llir.Context, app hlir.Application, pool hlir.WorkerPool, opts build.Options) (llir.Component, error) {
	spec := llir.ShellComponent{Component: lunchpail.WorkersComponent}

	spec.RunAsJob = true
	spec.Sizing = api.WorkerpoolSizing(pool, app, opts)
	spec.GroupName = pool.Metadata.Name
	spec.InstanceName = fmt.Sprintf("%s-%s", pool.Metadata.Name, ctx.Run.RunName)

	startupDelay, err := parseHumanTime(pool.Spec.StartupDelay)
	if err != nil {
		return nil, err
	}
	if app.Spec.Env == nil {
		app.Spec.Env = make(map[string]string)
	}

	queueArgs := fmt.Sprintf("--pool %s --worker $LUNCHPAIL_POD_NAME --verbose=%v --debug=%v ",
		pool.Metadata.Name,
		opts.Log.Verbose,
		opts.Log.Debug,
	)

	callingConvention := opts.CallingConvention
	if callingConvention == "" {
		callingConvention = app.Spec.CallingConvention
	}
	if callingConvention == "" {
		callingConvention = hlir.CallingConventionFiles
	}

	app.Spec.Command = fmt.Sprintf(`trap "$LUNCHPAIL_EXE component worker prestop %s" EXIT
$LUNCHPAIL_EXE component worker run --delay %d --calling-convention %v %s -- %s`,
		queueArgs,
		startupDelay,
		callingConvention,
		queueArgs,
		app.Spec.Command,
	)

	return shell.LowerAsComponent(
		buildName,
		ctx,
		app,
		spec,
		opts,
	)
}
