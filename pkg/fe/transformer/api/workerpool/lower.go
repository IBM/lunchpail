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

func Lower(buildName, runname string, app hlir.Application, pool hlir.WorkerPool, ir llir.LLIR, opts build.Options) (llir.Component, error) {
	spec := llir.ShellComponent{Component: lunchpail.WorkersComponent}

	spec.RunAsJob = true
	spec.Sizing = api.WorkerpoolSizing(pool, app, opts)
	spec.GroupName = pool.Metadata.Name
	spec.InstanceName = fmt.Sprintf("%s-%s", pool.Metadata.Name, runname)
	spec.QueuePrefixPath = api.QueuePrefixPathForWorker(ir.Queue, runname, pool.Metadata.Name)

	startupDelay, err := parseHumanTime(pool.Spec.StartupDelay)
	if err != nil {
		return nil, err
	}
	if app.Spec.Env == nil {
		app.Spec.Env = make(map[string]string)
	}

	app.Spec.Command = fmt.Sprintf(`trap "$LUNCHPAIL_EXE component worker prestop --verbose=%v --debug=%v --bucket %s --alive %s --dead %s" EXIT
$LUNCHPAIL_EXE component worker run --verbose=%v --debug=%v --bucket %s --alive %s --listen-prefix %s --delay %d -- %s`,
		opts.Log.Verbose,
		opts.Log.Debug,
		ir.Queue.Bucket,
		api.WorkerAlive(ir.Queue, runname, pool.Metadata.Name),
		api.WorkerDead(ir.Queue, runname, pool.Metadata.Name),
		opts.Log.Verbose,
		opts.Log.Debug,
		ir.Queue.Bucket,
		api.WorkerAlive(ir.Queue, runname, pool.Metadata.Name),
		api.QueuePrefixPathForWorker0(ir.Queue, runname, pool.Metadata.Name),
		startupDelay,
		app.Spec.Command,
	)

	return shell.LowerAsComponent(
		buildName,
		runname,
		app,
		ir,
		spec,
		opts,
	)
}
