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

func Lower(compilationName, runname, namespace string, app hlir.Application, spec llir.ApplicationInstanceSpec, opts compilation.Options, verbose bool) (llir.Component, error) {
	var component lunchpail.Component
	switch app.Spec.Role {
	case "worker":
		component = lunchpail.WorkersComponent
	default:
		component = lunchpail.DispatcherComponent
	}

	return LowerAsComponent(compilationName, runname, namespace, app, spec, opts, verbose, component)
}

func LowerAsComponent(compilationName, runname, namespace string, app hlir.Application, spec llir.ApplicationInstanceSpec, opts compilation.Options, verbose bool, component lunchpail.Component) (llir.Component, error) {
	sizing := spec.Sizing
	if sizing.Workers == 0 {
		sizing = api.ApplicationSizing(app, opts)
	}

	volumes, volumeMounts, envFroms, initContainers, dataseterr := api.DatasetsB64(app, spec.Queue)
	securityContext, errsc := util.ToYamlB64(app.Spec.SecurityContext)
	containerSecurityContext, errcsc := util.ToYamlB64(app.Spec.ContainerSecurityContext)
	workdirCmData, workdirCmMountPath, codeerr := api.CodeB64(app, namespace)

	env := ""
	if len(app.Spec.Env) > 0 {
		if menv, err := util.ToJsonEnvB64(app.Spec.Env); err != nil {
			return llir.Component{}, err
		} else {
			env = menv
		}
	}

	if codeerr != nil {
		return llir.Component{}, codeerr
	} else if dataseterr != nil {
		return llir.Component{}, dataseterr
	} else if errsc != nil {
		return llir.Component{}, errsc
	} else if errcsc != nil {
		return llir.Component{}, errcsc
	}

	templatePath, err := api.Stage(template, templateFile)
	if err != nil {
		return llir.Component{}, err
	} else if verbose {
		fmt.Fprintf(os.Stderr, "Shell stage %s\n", templatePath)
	} else {
		defer os.RemoveAll(templatePath)
	}

	terminationGracePeriodSeconds := 0
	if os.Getenv("CI") != "" {
		// tests may expect to observe output before self-destruction
		terminationGracePeriodSeconds = 5
	}

	queuePrefixPath := spec.QueuePrefixPath
	if queuePrefixPath == "" {
		queuePrefixPath = api.QueuePrefixPath(spec.Queue, runname)
	}

	instanceName := spec.InstanceName
	if instanceName == "" {
		instanceName = runname
	}

	values := []string{
		"lunchpail.instanceName=" + instanceName,
		"component=" + string(component),
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
		fmt.Sprintf("lunchpail.runAsJob=%v", spec.RunAsJob),
		"lunchpail.terminationGracePeriodSeconds=" + strconv.Itoa(terminationGracePeriodSeconds),
	}

	if len(app.Spec.Expose) > 0 {
		values = append(values, "expose="+util.ToPortArray(app.Spec.Expose))
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Shell values\n%s\n", strings.Replace(strings.Join(values, "\n  - "), workdirCmData, "", 1))
	}

	return api.GenerateComponent(instanceName, namespace, templatePath, spec.Values.Yaml, values, verbose, component)
}
