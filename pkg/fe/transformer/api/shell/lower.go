package shell

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
)

func Lower(compilationName, runname, namespace string, app hlir.Application, queueSpec queue.Spec, opts compilation.Options, verbose bool) (llir.Component, error) {
	component := ""
	switch app.Spec.Role {
	case "dispatcher":
		component = "workdispatcher"
	case "worker":
		component = "workerpool"
	default:
		component = "shell"
	}

	sizing := api.ApplicationSizing(app, opts)
	volumes, volumeMounts, envFroms, _, dataseterr := api.DatasetsB64(app, queueSpec)
	securityContext, errsc := util.ToYamlB64(app.Spec.SecurityContext)
	containerSecurityContext, errcsc := util.ToYamlB64(app.Spec.ContainerSecurityContext)
	workdirCmData, workdirCmMountPath, codeerr := api.CodeB64(app, namespace)

	env := ""
	if len(app.Spec.Env) > 0 {
		if menv, err := util.ToJsonB64(app.Spec.Env); err != nil {
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

	values := []string{
		"name=" + runname,
		"partOf=" + compilationName,
		"component=" + component,
		"enclosingRun=" + runname,
		"image=" + app.Spec.Image,
		"namespace=" + namespace,
		"command=" + app.Spec.Command,
		"workers.count=" + strconv.Itoa(sizing.Workers),
		"workers.cpu=" + sizing.Cpu,
		"workers.memory=" + sizing.Memory,
		"workers.gpu=" + strconv.Itoa(sizing.Gpu),
		"volumes=" + volumes,
		"volumeMounts=" + volumeMounts,
		"envFroms=" + envFroms,
		"env=" + env,
		"taskqueue.prefixPath=" + api.QueuePrefixPath(queueSpec, runname),
		"mcad.enabled=false",
		"rbac.runAsRoot=false",
		"rbac.serviceaccount=" + runname,
		"securityContext=" + securityContext,
		"containerSecurityContext=" + containerSecurityContext,
		"workdir.cm.data=" + workdirCmData,
		"workdir.cm.mount_path=" + workdirCmMountPath,
		"lunchpail.image.registry=" + lunchpail.ImageRegistry,
		"lunchpail.image.repo=" + lunchpail.ImageRepo,
		"lunchpail.image.version=" + lunchpail.Version(),
	}

	if len(app.Spec.Expose) > 0 {
		values = append(values, "expose="+util.ToArray(app.Spec.Expose))
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Shell values\n%s\n", strings.Replace(strings.Join(values, "\n  - "), workdirCmData, "", 1))
	}

	return api.GenerateComponent(runname, namespace, templatePath, values, verbose, lunchpail.DispatcherComponent)
}
