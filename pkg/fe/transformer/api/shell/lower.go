package shell

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
)

func Lower(compilationName, runname, namespace string, app hlir.Application, ir llir.LLIR, opts compilation.Options, verbose bool) (llir.Component, error) {
	var component lunchpail.Component
	switch app.Spec.Role {
	case "worker":
		component = lunchpail.WorkersComponent
	default:
		component = lunchpail.DispatcherComponent
	}

	return LowerAsComponent(compilationName, runname, namespace, app, ir, llir.ShellComponent{Component: component}, opts, verbose)
}

func LowerAsComponent(compilationName, runname, namespace string, app hlir.Application, ir llir.LLIR, component llir.ShellComponent, opts compilation.Options, verbose bool) (llir.Component, error) {
	sizing := component.Sizing
	if sizing.Workers == 0 {
		sizing = api.ApplicationSizing(app, opts)
		component.Sizing = sizing
	}

	volumes, volumeMounts, envFroms, initContainers, dataseterr := api.DatasetsB64(app, ir.Queue)
	securityContext, errsc := util.ToYamlB64(app.Spec.SecurityContext)
	containerSecurityContext, errcsc := util.ToYamlB64(app.Spec.ContainerSecurityContext)
	workdirCmData, workdirCmMountPath, codeerr := api.CodeB64(app, namespace)

	env := ""
	if len(app.Spec.Env) > 0 {
		if menv, err := util.ToJsonEnvB64(app.Spec.Env); err != nil {
			return nil, err
		} else {
			env = menv
		}
	}
	component.Env = app.Spec.Env

	if codeerr != nil {
		return nil, codeerr
	} else if dataseterr != nil {
		return nil, dataseterr
	} else if errsc != nil {
		return nil, errsc
	} else if errcsc != nil {
		return nil, errcsc
	}

	terminationGracePeriodSeconds := 0
	if os.Getenv("CI") != "" {
		// tests may expect to observe output before self-destruction
		terminationGracePeriodSeconds = 5
	}

	queuePrefixPath := component.QueuePrefixPath
	if queuePrefixPath == "" {
		queuePrefixPath = api.QueuePrefixPath(ir.Queue, runname)
		component.QueuePrefixPath = queuePrefixPath
	}

	instanceName := component.InstanceName
	if instanceName == "" {
		instanceName = runname
		component.InstanceName = instanceName
	}

	component.Values = []string{
		"lunchpail.instanceName=" + instanceName,
		"lunchpail.component=" + string(component.Component),
		"image=" + app.Spec.Image,
		"command=" + app.Spec.Command,
		"workers.count=" + strconv.Itoa(sizing.Workers),
		"workers.cpu=" + sizing.Cpu,
		"workers.memory=" + sizing.Memory,
		"workers.gpu=" + strconv.Itoa(sizing.Gpu),
		"volumes=" + volumes,
		"volumeMounts=" + volumeMounts,
		"initContainers=" + initContainers,
		"envFroms=" + envFroms,
		"env=" + env,
		"taskqueue.prefixPath=" + queuePrefixPath,
		"securityContext=" + securityContext,
		"containerSecurityContext=" + containerSecurityContext,
		"workdir.cm.data=" + workdirCmData,
		"workdir.cm.mount_path=" + workdirCmMountPath,
		fmt.Sprintf("lunchpail.runAsJob=%v", component.RunAsJob),
		"lunchpail.terminationGracePeriodSeconds=" + strconv.Itoa(terminationGracePeriodSeconds),
	}

	if len(app.Spec.Expose) > 0 {
		component.Values = append(component.Values, "expose="+util.ToPortArray(app.Spec.Expose))
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Shell values\n%s\n", strings.Replace(strings.Join(component.Values, "\n  - "), workdirCmData, "", 1))
	}

	return component, nil
}
