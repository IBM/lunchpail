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

	poolName := pool.Metadata.Name
	if ctx.Run.Step > 0 {
		poolName = fmt.Sprintf("%s-%d", poolName, ctx.Run.Step)
	}

	spec.RunAsJob = true
	spec.Sizing = api.WorkerpoolSizing(pool, app, opts)
	spec.GroupName = poolName
	spec.InstanceName = fmt.Sprintf("%s-%s", poolName, ctx.Run.RunName)

	startupDelay, err := parseHumanTime(pool.Spec.StartupDelay)
	if err != nil {
		return nil, err
	}
	if app.Spec.Env == nil {
		app.Spec.Env = make(map[string]string)
	}

	queueArgs := fmt.Sprintf("--step %d --pool %s --worker $LUNCHPAIL_POD_NAME --verbose=%v --debug=%v ",
		ctx.Run.Step,
		poolName,
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
