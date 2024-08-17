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

	/*values := []string{
		"name=" + app.Metadata.Name,
		"runName=" + runname,
		"partOf=" + compilationName,
		"component=workerpool",
		"enclosingRun=" + runname,
		"image=" + app.Spec.Image,
		"namespace=" + namespace,
		"command=" + app.Spec.Command,
		"workers.count=" + strconv.Itoa(sizing.Workers),
		"workers.cpu=" + sizing.Cpu,
		"workers.memory=" + sizing.Memory,
		"workers.gpu=" + strconv.Itoa(sizing.Gpu),
		"lunchpail.poolName=" + pool.Metadata.Name,
		"taskqueue.prefixPath=" + api.QueuePrefixPathForWorker(spec.Queue, runname, pool.Metadata.Name),
		"volumes=" + volumes,
		"volumeMounts=" + volumeMounts,
		"envFroms=" + envFroms,
		"initContainers=" + initContainers,
		"env=" + env,
		"startupDelay=" + strconv.Itoa(startupDelay),
		"mcad.enabled=false",
		"rbac.runAsRoot=false",
		"rbac.serviceaccount=" + spec.ServiceAccount,
		"securityContext=" + securityContext,
		"containerSecurityContext=" + containerSecurityContext,
		"workdir.cm.data=" + workdirCmData,
		"workdir.cm.mount_path=" + workdirCmMountPath,
		"watcher.image.registry=" + lunchpail.ImageRegistry,
		"watcher.image.repo=" + lunchpail.ImageRepo,
		"watcher.image.version=" + lunchpail.Version(),
	}

	if len(app.Spec.Expose) > 0 {
		values = append(values, "expose="+util.ToPortArray(app.Spec.Expose))
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "WorkerPool values\n%s\n", strings.Replace(strings.Join(values, "\n  - "), workdirCmData, "", 1))
	}

	return api.GenerateComponent(releaseName, namespace, templatePath, values, verbose, comp.WorkersComponent)*/
}
