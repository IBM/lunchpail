package workstealer

import (
	"fmt"
	"os"
	"strings"

	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(assemblyName, runname, namespace string, app hlir.Application, queueSpec queue.Spec, repoSecrets []hlir.RepoSecret, opts assembly.Options, verbose bool) (llir.Component, error) {
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
		"partOf=" + assemblyName,
		"namespace.user=" + namespace,
		"lunchpail=lunchpail",
		"mcad.enabled=false",
		"rbac.serviceaccount=" + runname,
		"image.registry=" + lunchpail.ImageRegistry,
		"image.repo=" + lunchpail.ImageRepo,
		"image.version=" + lunchpail.Version(),
		fmt.Sprintf("internalS3.enabled=%v", queueSpec.Auto),
		fmt.Sprintf("internalS3.port=%d", queueSpec.Port),
		"internalS3.accessKey=lunchpail", // TODO externalize
		"internalS3.secretKey=lunchpail", // TODO externalize
		"taskqueue.dataset=" + queueSpec.Name,
		"taskqueue.endpoint=" + queueSpec.Endpoint,
		"taskqueue.bucket=" + queueSpec.Bucket,
		"taskqueue.accessKey=" + queueSpec.AccessKey,
		"taskqueue.secretKey=" + queueSpec.SecretKey,
		"sleep_before_exit=" + os.Getenv("LP_SLEEP_BEFORE_EXIT"),
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Workstealer values\n%s\n", "\n  -"+strings.Join(values, "\n  - "))
	}

	return api.GenerateComponent(runname, namespace, templatePath, values, verbose)
}
