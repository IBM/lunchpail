package workerpool

import (
	"fmt"
	"strconv"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/fe/transformer/api/shell"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(compilationName, runname, namespace string, app hlir.Application, pool hlir.WorkerPool, spec llir.ApplicationInstanceSpec, opts compilation.Options, verbose bool) (llir.Component, error) {
	spec.RunAsJob = true
	spec.Sizing = api.WorkerpoolSizing(pool, app, opts)
	spec.InstanceName = pool.Metadata.Name
	spec.QueuePrefixPath = api.QueuePrefixPathForWorker(spec.Queue, runname, pool.Metadata.Name)

	startupDelay, err := parseHumanTime(pool.Spec.StartupDelay)
	if err != nil {
		return llir.Component{}, err
	}
	if app.Spec.Env == nil {
		app.Spec.Env = make(map[string]string)
	}
	app.Spec.Env["LUNCHPAIL_STARTUP_DELAY"] = strconv.Itoa(startupDelay)

	// for now, we don't distinguish the two...
	debug := verbose

	app.Spec.Command = fmt.Sprintf(`trap "/workdir/lunchpail worker prestop" EXIT
/workdir/lunchpail worker run --debug=%v -- %s`, debug, app.Spec.Command)

	return shell.LowerAsComponent(
		compilationName,
		runname,
		namespace,
		app,
		spec,
		opts,
		verbose,
		lunchpail.WorkersComponent,
	)
}
