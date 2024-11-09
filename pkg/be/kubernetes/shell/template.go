package shell

import (
	"fmt"
	"os"
	"slices"
	"strconv"
	"strings"

	"lunchpail.io/pkg/be/helm"
	"lunchpail.io/pkg/be/kubernetes/common"
	"lunchpail.io/pkg/be/kubernetes/names"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
)

func Template(ir llir.LLIR, c llir.ShellComponent, namespace string, opts common.Options) (string, error) {
	templatePath, err := stage(template, templateFile)
	if err != nil {
		return "", err
	} else if opts.Log.Verbose {
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

	volumes, volumeMounts, envFroms, initContainers, secrets, err := datasetsB64(c.Application, ir.Context)
	if err != nil {
		return "", err
	}

	workdirCmData, workdirCmMountPath, blobCmMountPath, err := codeB64(c.Application)
	if err != nil {
		return "", err
	}

	groupName := c.GroupName
	if groupName == "" {
		groupName = c.InstanceName
	}

	// values for this component
	myValues := []string{
		fmt.Sprintf("lunchpail.step=%d", ir.Context.Run.Step),
		"lunchpail.groupName=" + util.TrimToMax(groupName, 63),         // in kubernetes, labels must have a max length of 63 chars
		"lunchpail.instanceName=" + util.TrimToMax(c.InstanceName, 63), // in kubernetes, labels must have a max length of 63 chars
		"lunchpail.component=" + string(c.Component),
		"image=" + c.Application.Spec.Image,
		"command=" + updateTestQueueEndpoint(c.Application.Spec.Command, ir.Queue()),
		fmt.Sprintf("lunchpail.runAsJob=%v", c.RunAsJob),
		"lunchpail.terminationGracePeriodSeconds=" + strconv.Itoa(terminationGracePeriodSeconds),
		"workers.count=" + strconv.Itoa(c.Sizing.Workers),
		"workers.cpu=" + c.Sizing.Cpu,
		"workers.memory=" + c.Sizing.Memory,
		"workers.gpu=" + strconv.Itoa(c.Sizing.Gpu),
		"securityContext=" + securityContext,
		"containerSecurityContext=" + containerSecurityContext,
		"taskqueue.bucket=" + ir.Queue().Bucket,
		"volumes=" + volumes,
		"volumeMounts=" + volumeMounts,
		"initContainers=" + initContainers,
		"envFroms=" + envFroms,
		"workdir.cm.data=" + workdirCmData,
		"workdir.cm.mount_path=" + workdirCmMountPath,
		"workdir.cm.blob_path=" + blobCmMountPath,
	}

	if len(secrets) > 0 {
		myValues = append(myValues, "lunchpail.secrets="+util.ToB64Array(secrets))
		myValues = append(myValues, "lunchpail.secretPrefix="+ir.RunName()+"-")
	}

	if len(c.Application.Spec.Env) > 0 {
		if c.C() == lunchpail.MinioComponent && c.Application.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] == "" {
			// we'll need a bit of extra time to download
			// files before minio server terminates
			c.Application.Spec.Env["LUNCHPAIL_SLEEP_BEFORE_EXIT"] = "5"
		}

		if env, err := util.ToJsonEnvB64(c.Application.Spec.Env); err != nil {
			return "", err
		} else {
			myValues = append(myValues, "env="+env)
		}
	}

	if len(c.Application.Spec.Expose) > 0 {
		myValues = append(myValues, "expose="+util.ToPortArray(c.Application.Spec.Expose))
	}

	commonValues, err := common.Values(ir, opts)
	if err != nil {
		return "", err
	}

	values := slices.Concat(commonValues, myValues)

	if opts.Log.Verbose {
		workdirCmData := ""
		fmt.Fprintf(os.Stderr, "Shell values\n%s\n", strings.Replace(strings.Join(values, "\n  - "), workdirCmData, "", 1))
	}

	return helm.Template(
		names.Resource(c.InstanceName, c.Component),
		namespace,
		templatePath,
		"", // no yaml values at the moment
		helm.TemplateOptions{Verbose: opts.Log.Verbose, OverrideValues: values},
	)
}
