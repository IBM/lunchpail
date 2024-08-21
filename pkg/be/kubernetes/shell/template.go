package shell

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"lunchpail.io/pkg/be/kubernetes/common"
	templater "lunchpail.io/pkg/fe/template"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
)

func Template(ir llir.LLIR, c llir.ShellComponent, opts common.Options, verbose bool) (string, error) {
	templatePath, err := stage(template, templateFile)
	if err != nil {
		return "", err
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

	securityContext, err := util.ToYamlB64(c.Application.Spec.SecurityContext)
	if err != nil {
		return "", err
	}

	containerSecurityContext, err := util.ToYamlB64(c.Application.Spec.ContainerSecurityContext)
	if err != nil {
		return "", err
	}

	volumes, volumeMounts, envFroms, initContainers, err := api.DatasetsB64(c.Application, ir.Queue)
	if err != nil {
		return "", err
	}

	workdirCmData, workdirCmMountPath, err := api.CodeB64(c.Application, ir.Namespace)
	if err != nil {
		return "", err
	}

	imagePullSecretName, dockerconfigjson, err := common.ImagePullSecret(opts.ImagePullSecret)
	if err != nil {
		return "", err
	}

	serviceAccount := ir.RunName
	if !opts.NeedsServiceAccount && imagePullSecretName == "" {
		serviceAccount = ""
	}

	values := []string{
		// common values
		"lunchpail.ips.name=" + imagePullSecretName,
		"lunchpail.ips.dockerconfigjson=" + dockerconfigjson,
		fmt.Sprintf("lunchpail.namespace.create=%v", opts.CreateNamespace),
		"lunchpail.rbac.serviceaccount=" + serviceAccount,
		fmt.Sprintf("lunchpail.taskqueue.auto=%v", ir.Queue.Auto),
		"lunchpail.taskqueue.dataset=" + ir.Queue.Name,
		"lunchpail.taskqueue.endpoint=" + ir.Queue.Endpoint,
		"lunchpail.taskqueue.bucket=" + ir.Queue.Bucket,
		"lunchpail.taskqueue.accessKey=" + ir.Queue.AccessKey,
		"lunchpail.taskqueue.secretKey=" + ir.Queue.SecretKey,
		"lunchpail.image.registry=" + lunchpail.ImageRegistry,
		"lunchpail.image.repo=" + lunchpail.ImageRepo,
		"lunchpail.image.version=" + lunchpail.Version(),

		// shell-specific values
		"lunchpail.instanceName=" + c.InstanceName,
		"lunchpail.component=" + string(c.Component),
		"image=" + c.Application.Spec.Image,
		"command=" + c.Application.Spec.Command,
		fmt.Sprintf("lunchpail.runAsJob=%v", c.RunAsJob),
		"lunchpail.terminationGracePeriodSeconds=" + strconv.Itoa(terminationGracePeriodSeconds),
		"workers.count=" + strconv.Itoa(c.Sizing.Workers),
		"workers.cpu=" + c.Sizing.Cpu,
		"workers.memory=" + c.Sizing.Memory,
		"workers.gpu=" + strconv.Itoa(c.Sizing.Gpu),
		"securityContext=" + securityContext,
		"containerSecurityContext=" + containerSecurityContext,
		"taskqueue.prefixPath=" + c.QueuePrefixPath,
		"volumes=" + volumes,
		"volumeMounts=" + volumeMounts,
		"initContainers=" + initContainers,
		"envFroms=" + envFroms,
		"workdir.cm.data=" + workdirCmData,
		"workdir.cm.mount_path=" + workdirCmMountPath,
	}

	if len(c.Application.Spec.Env) > 0 {
		if env, err := util.ToJsonEnvB64(c.Application.Spec.Env); err != nil {
			return "", err
		} else {
			values = append(values, "env="+env)
		}
	}

	if len(c.Application.Spec.Expose) > 0 {
		values = append(values, "expose="+util.ToPortArray(c.Application.Spec.Expose))
	}

	if verbose {
		workdirCmData := ""
		fmt.Fprintf(os.Stderr, "Shell values\n%s\n", strings.Replace(strings.Join(values, "\n  - "), workdirCmData, "", 1))
	}

	parts, err := templater.Template(
		ir.RunName+"-"+string(c.Component),
		ir.Namespace,
		templatePath,
		ir.Values.Yaml,
		templater.TemplateOptions{Verbose: verbose, OverrideValues: values},
	)
	if err != nil {
		return "", err
	}

	return parts, nil
}
