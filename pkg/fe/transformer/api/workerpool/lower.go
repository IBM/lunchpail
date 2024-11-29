package workerpool

import (
	"fmt"

	"github.com/dustin/go-humanize"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(buildName string, ctx llir.Context, app hlir.Application, pool hlir.WorkerPool, opts build.Options) (llir.ShellComponent, error) {
	spec := llir.ShellComponent{Component: lunchpail.WorkersComponent}

	// maybe at some point... we would need to update at least be/local.watchForWorkerPools also to watch for dispatchers?
	//	if app.Spec.IsDispatcher {
	//		spec.Component = lunchpail.DispatcherComponent
	//	}

	poolName := pool.Metadata.Name
	if ctx.Run.Step > 0 {
		poolName = fmt.Sprintf("%s-%d", poolName, ctx.Run.Step)
	}

	spec.RunAsJob = true

	if pool.Spec.Workers.MinMemory != "" {
		if bytes, err := humanize.ParseBytes(pool.Spec.Workers.MinMemory); err != nil {
			return spec, err
		} else {
			spec.MinMemoryBytes = bytes
		}
	}

	if pool.Spec.Workers.Count != 0 {
		spec.InitialWorkers = pool.Spec.Workers.Count
	} else {
		spec.InitialWorkers = 1
	}

	spec.GroupName = poolName
	spec.InstanceName = fmt.Sprintf("%s-%s", poolName, ctx.Run.RunName)

	startupDelay, err := parseHumanTime(pool.Spec.StartupDelay)
	if err != nil {
		return llir.ShellComponent{}, err
	}
	if app.Spec.Env == nil {
		app.Spec.Env = make(map[string]string)
	}

	queueArgs := fmt.Sprintf("--step %d --pool %s --worker $LUNCHPAIL_POD_NAME --verbose=%v --debug=%v",
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
$LUNCHPAIL_EXE component worker run --pack %d --gunzip=%v --delay %d --calling-convention %v %s -- %s`,
		queueArgs,
		opts.Pack,
		opts.Gunzip,
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
