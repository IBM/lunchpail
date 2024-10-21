package workerpool

import (
	"fmt"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(buildName string, run queue.RunContext, app hlir.Application, pool hlir.WorkerPool, ir llir.LLIR, opts build.Options) (llir.Component, error) {
	spec := llir.ShellComponent{Component: lunchpail.WorkersComponent}

	spec.RunAsJob = true
	spec.Sizing = api.WorkerpoolSizing(pool, app, opts)
	spec.GroupName = pool.Metadata.Name
	spec.InstanceName = fmt.Sprintf("%s-%s", pool.Metadata.Name, run.RunName)

	startupDelay, err := parseHumanTime(pool.Spec.StartupDelay)
	if err != nil {
		return nil, err
	}
	if app.Spec.Env == nil {
		app.Spec.Env = make(map[string]string)
	}

	queueArgs := fmt.Sprintf("--pool %s --worker $LUNCHPAIL_POD_NAME --verbose=%v --debug=%v ", pool.Metadata.Name, opts.Log.Verbose, opts.Log.Debug)
	app.Spec.Command = fmt.Sprintf(`trap "$LUNCHPAIL_EXE component worker prestop %s" EXIT
$LUNCHPAIL_EXE component worker run --delay %d %s -- %s`,
		queueArgs,
		startupDelay,
		queueArgs,
		app.Spec.Command,
	)

	return shell.LowerAsComponent(
		buildName,
		run,
		app,
		ir,
		spec,
		opts,
	)
}
