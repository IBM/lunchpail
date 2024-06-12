package shell

import (
	"fmt"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
	"os"
	"strconv"
	"strings"
)

func Lower(assemblyName, runname, namespace string, app hlir.Application, queueSpec queue.Spec, repoSecrets []hlir.RepoSecret, opts assembly.Options, verbose bool) ([]string, error) {
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
	env, enverr := util.ToJsonB64(app.Spec.Env)
	securityContext, errsc := util.ToYamlB64(app.Spec.SecurityContext)
	containerSecurityContext, errcsc := util.ToYamlB64(app.Spec.ContainerSecurityContext)
	workdirRepo, workdirUser, workdirPat, workdirCmData, workdirCmMountPath, codeerr := api.CodeB64(app, namespace, repoSecrets)

	if codeerr != nil {
		return []string{}, codeerr
	} else if dataseterr != nil {
		return []string{}, dataseterr
	} else if enverr != nil {
		return []string{}, enverr
	} else if errsc != nil {
		return []string{}, errsc
	} else if errcsc != nil {
		return []string{}, errcsc
	}

	templatePath, err := api.Stage(template, templateFile)
	if err != nil {
		return []string{}, err
	} else if verbose {
		fmt.Fprintf(os.Stderr, "Shell stage %s\n", templatePath)
	} else {
		defer os.RemoveAll(templatePath)
	}

	values := []string{
		"name=" + runname,
		"partOf=" + assemblyName,
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
		"queue.dataset=" + queueSpec.Name,
		"mcad.enabled=false",
		"rbac.runAsRoot=false",
		"rbac.serviceaccount=" + runname,
		"securityContext=" + securityContext,
		"containerSecurityContext=" + containerSecurityContext,
		"workdir.repo=" + workdirRepo,
		"workdir.user=" + workdirUser,
		"workdir.pat=" + workdirPat,
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

	topts := linker.TemplateOptions{}
	topts.OverrideValues = values
	yaml, err := linker.Template(runname, namespace, templatePath, "", topts)
	if err != nil {
		return []string{}, err
	}

	return []string{yaml}, nil
}
