package minio

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(compilationName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, opts compilation.Options, verbose bool) ([]llir.Component, error) {
	components := []llir.Component{}

	templatePath, err := api.Stage(template, templateFile)

	if err != nil {
		return []llir.Component{}, err
	} else if verbose {
		fmt.Fprintf(os.Stderr, "Minio stage %s\n", templatePath)
	} else {
		defer os.RemoveAll(templatePath)
	}

	prefixIncludingBucket := api.QueuePrefixPath(queueSpec, runname)
	A := strings.Split(prefixIncludingBucket, "/")
	prefixExcludingBucket := filepath.Join(A[1:]...)

	values := []string{
		"name=" + runname,
		"partOf=" + compilationName,
		"namespace.user=" + namespace,
		"lunchpail=lunchpail",
		"mcad.enabled=false",
		"image.registry=" + lunchpail.ImageRegistry,
		"image.repo=" + lunchpail.ImageRepo,
		"image.version=" + lunchpail.Version(),
		fmt.Sprintf("internalS3.enabled=%v", queueSpec.Auto),
		fmt.Sprintf("internalS3.port=%d", queueSpec.Port),
		fmt.Sprintf("taskqueue.bucket=%s", queueSpec.Bucket),
		fmt.Sprintf("taskqueue.prefix=%s", prefixExcludingBucket),
		"internalS3.accessKey=lunchpail", // TODO externalize
		"internalS3.secretKey=lunchpail", // TODO externalize
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Minio values\n%s\n", "\n  -"+strings.Join(values, "\n  - "))
	}

	component, err := api.GenerateComponent(runname, namespace, templatePath, values, verbose, lunchpail.MinioComponent)
	if err != nil {
		return []llir.Component{}, err
	}
	component.Name = "minio"
	return append(components, component), nil
}
