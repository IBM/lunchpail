package linker

import (
	"embed"
	"fmt"
	"io/ioutil"
	"lunchpail.io/pkg/fe/linker/helm"
	"lunchpail.io/pkg/fe/linker/yaml/queue"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
	"os"
	"strconv"
	"strings"
)

//go:generate /bin/sh -c "[ -d ../../../charts/shell ] && tar --exclude '*~' --exclude '*README.md' -C ../../../charts/shell -zcf shell.tar.gz . || exit 0"
//go:embed shell.tar.gz
var shellTemplate embed.FS

func stage(fs embed.FS, file string) (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := util.Expand(dir, fs, file, false); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}

func TransformShell(appname, runname, namespace string, app Application, queueSpec queue.Spec, repoSecrets []RepoSecret, verbose bool) ([]string, error) {
	component := ""
	switch app.Spec.Role {
	case "dispatcher":
		component = "workdispatcher"
	case "worker":
		component = "workerpool"
	default:
		component = "shell"
	}

	sizing := app.sizing()
	volumes, volumeMounts, envFroms, dataseterr := datasetsB64(app, queueSpec)
	env, enverr := helm.ToJsonB64(app.Spec.Env)
	securityContext, errsc := helm.ToYamlB64(app.Spec.SecurityContext)
	containerSecurityContext, errcsc := helm.ToYamlB64(app.Spec.ContainerSecurityContext)
	workdirRepo, workdirSecretName, workdirCmData, workdirCmMountPath, codeerr := codeB64(app, namespace, repoSecrets)
	imageRegistry := "ghcr.io"
	imageRepo := "lunchpail"
	imageVersion := lunchpail.Version()

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

	templatePath, err := stage(shellTemplate, "shell.tar.gz")
	if err != nil {
		return []string{}, err
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Shell stage %s\n", templatePath)
	} else {
		defer os.RemoveAll(templatePath)
	}

	values := []string{
		"name=" + runname,
		"partOf=" + appname,
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
		"workdir.secretName=" + workdirSecretName,
		"workdir.cm.data=" + workdirCmData,
		"workdir.cm.mount_path=" + workdirCmMountPath,
		"lunchpail.image.registry=" + imageRegistry,
		"lunchpail.image.repo=" + imageRepo,
		"lunchpail.image.version=" + imageVersion,
	}

	if len(app.Spec.Expose) > 0 {
		values = append(values, "expose="+helm.ToArray(app.Spec.Expose))
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Shell values\n%s\n", strings.Replace(strings.Join(values, "\n  - "), workdirCmData, "", 1))
	}

	opts := helm.TemplateOptions{}
	opts.OverrideValues = values
	yaml, err := helm.Template(runname, namespace, templatePath, "", opts)
	if err != nil {
		return []string{}, err
	}

	return []string{yaml}, nil
}
