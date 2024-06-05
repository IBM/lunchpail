package workerpool

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
)

func Lower(assemblyName, runname, namespace string, app hlir.Application, pool hlir.WorkerPool, queueSpec queue.Spec, repoSecrets []hlir.RepoSecret, verbose bool) ([]llir.Yaml, error) {
	// name of worker pods/deployment = run_name-pool_name
	releaseName := strings.TrimSuffix(
		util.Truncate(
			fmt.Sprintf(
				"%s-%s",
				runname,
				strings.Replace(pool.Metadata.Name, app.Metadata.Name+"-", "", -1),
			),
			53,
		),
		"-",
	)

	sizing := api.WorkerpoolSizing(pool, app)
	volumes, volumeMounts, envFroms, initContainers, dataseterr := api.DatasetsB64(app, queueSpec)
	env, enverr := util.ToJsonB64(app.Spec.Env)
	securityContext, errsc := util.ToYamlB64(app.Spec.SecurityContext)
	containerSecurityContext, errcsc := util.ToYamlB64(app.Spec.ContainerSecurityContext)
	workdirRepo, workdirSecretName, workdirCmData, workdirCmMountPath, codeerr := api.CodeB64(app, namespace, repoSecrets)

	yamls := []llir.Yaml{}

	if codeerr != nil {
		return yamls, codeerr
	} else if dataseterr != nil {
		return yamls, dataseterr
	} else if enverr != nil {
		return yamls, enverr
	} else if errsc != nil {
		return yamls, errsc
	} else if errcsc != nil {
		return yamls, errcsc
	}

	templatePath, err := api.Stage(template, templateFile)
	if err != nil {
		return yamls, err
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Workerpool stage %s\n", templatePath)
	} else {
		defer os.RemoveAll(templatePath)
	}

	startupDelay, err := parseHumanTime(pool.Spec.StartupDelay)
	if err != nil {
		return yamls, err
	}

	values := []string{
		"name=" + app.Metadata.Name,
		"runName=" + runname,
		"partOf=" + assemblyName,
		"component=workerpool",
		"enclosingRun=" + runname,
		"image=" + app.Spec.Image,
		"namespace=" + namespace,
		"command=" + app.Spec.Command,
		"workers.count=" + strconv.Itoa(sizing.Workers),
		"workers.cpu=" + sizing.Cpu,
		"workers.memory=" + sizing.Memory,
		"workers.gpu=" + strconv.Itoa(sizing.Gpu),
		"lunchpail=lunchpail",
		"queue.dataset=" + queueSpec.Name,
		"volumes=" + volumes,
		"volumeMounts=" + volumeMounts,
		"envFroms=" + envFroms,
		"initContainers=" + initContainers,
		"env=" + env,
		"startupDelay=" + strconv.Itoa(startupDelay),
		"mcad.enabled=false",
		"rbac.runAsRoot=false",
		"rbac.serviceaccount=" + runname,
		"securityContext=" + securityContext,
		"containerSecurityContext=" + containerSecurityContext,
		"workdir.repo=" + workdirRepo,
		"workdir.secretName=" + workdirSecretName,
		"workdir.cm.data=" + workdirCmData,
		"workdir.cm.mount_path=" + workdirCmMountPath,
		"watcher.image.registry=" + lunchpail.ImageRegistry,
		"watcher.image.repo=" + lunchpail.ImageRepo,
		"watcher.image.version=" + lunchpail.Version(),
	}

	if len(app.Spec.Expose) > 0 {
		values = append(values, "expose="+util.ToArray(app.Spec.Expose))
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "WorkerPool values\n%s\n", strings.Replace(strings.Join(values, "\n  - "), workdirCmData, "", 1))
	}

	opts := linker.TemplateOptions{}
	opts.OverrideValues = values
	opts.Verbose = verbose
	yaml, err := linker.Template(releaseName, namespace, templatePath, "", opts)
	if err != nil {
		return yamls, err
	}

	context := pool.Spec.Target.Kubernetes.Context

	return append(yamls, llir.Yaml{Yamls: []string{yaml}, Context: context}), nil
}
