package linker

import (
	"embed"
	"fmt"
	"lunchpail.io/pkg/fe/linker/helm"
	"lunchpail.io/pkg/fe/linker/yaml/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/util"
	"os"
	"strconv"
	"strings"
)

//go:generate /bin/sh -c "[ -d ../../../charts/workerpool ] && tar --exclude '*~' --exclude '*README.md' -C ../../../charts/workerpool -zcf workerpool.tar.gz . || exit 0"
//go:embed workerpool.tar.gz
var workerpoolTemplate embed.FS

// parse 6s/6m/6d/6w into units of seconds
func parseHumanTime(delayString string) (int, error) {
	if delayString == "" {
		return 0, nil
	}

	seconds_per_unit := map[byte]int{'s': 1, 'm': 60, 'h': 3600, 'd': 86400, 'w': 604800}
	unit, hasUnit := seconds_per_unit[delayString[len(delayString)-1]]
	quantity := delayString

	if !hasUnit {
		// then we were given just a number, which we will interpret as
		// seconds
		unit = 1
	} else {
		quantity = delayString[:len(delayString)-1]
	}

	val, err := strconv.Atoi(quantity)
	if err != nil {
		return 0, err
	}

	return val * unit, nil
}

func TransformWorkerPool(assemblyName, runname, namespace string, app hlir.Application, pool hlir.WorkerPool, queueSpec queue.Spec, repoSecrets []hlir.RepoSecret, verbose bool) ([]string, error) {
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

	sizing := workerpoolSizing(pool, app)
	volumes, volumeMounts, envFroms, dataseterr := datasetsB64(app, queueSpec)
	env, enverr := helm.ToJsonB64(app.Spec.Env)
	securityContext, errsc := helm.ToYamlB64(app.Spec.SecurityContext)
	containerSecurityContext, errcsc := helm.ToYamlB64(app.Spec.ContainerSecurityContext)
	workdirRepo, workdirSecretName, workdirCmData, workdirCmMountPath, codeerr := codeB64(app, namespace, repoSecrets)

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

	templatePath, err := stage(workerpoolTemplate, "workerpool.tar.gz")
	if err != nil {
		return []string{}, err
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Workerpool stage %s\n", templatePath)
	} else {
		defer os.RemoveAll(templatePath)
	}

	startupDelay, err := parseHumanTime(pool.Spec.StartupDelay)
	if err != nil {
		return []string{}, err
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
	}

	if len(app.Spec.Expose) > 0 {
		values = append(values, "expose="+helm.ToArray(app.Spec.Expose))
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "WorkerPool values\n%s\n", strings.Replace(strings.Join(values, "\n  - "), workdirCmData, "", 1))
	}

	opts := helm.TemplateOptions{}
	opts.OverrideValues = values
	opts.Verbose = verbose
	yaml, err := helm.Template(releaseName, namespace, templatePath, "", opts)
	if err != nil {
		return []string{}, err
	}

	return []string{yaml}, nil
}
