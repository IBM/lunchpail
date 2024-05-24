package helm

import (
	"fmt"
	"io/ioutil"
	"os"

	"github.com/kirsle/configdir"
	"github.com/mittwald/go-helm-client"
	"github.com/mittwald/go-helm-client/values"
)

type TemplateOptions struct {
	OverrideValues  []string
	Verbose         bool
}

func Client(namespace string, verbose bool) (helmclient.Client, error) {
	helmCacheDir := configdir.LocalCache("helm")
	if verbose {
		fmt.Fprintf(os.Stderr, "Using Helm repository cache=%s\n", helmCacheDir)
	}

	outputOfHelmCmd := ioutil.Discard
	if verbose {
		outputOfHelmCmd = os.Stdout
	}

	return helmclient.New(&helmclient.Options{Namespace: namespace,
		Output:          outputOfHelmCmd,
		RepositoryCache: helmCacheDir,
	})
}

func Template(releaseName, namespace, templatePath, yaml string, opts TemplateOptions) (string, error) {
	chartSpec := helmclient.ChartSpec{
		ReleaseName:      releaseName,
		ChartName:        templatePath,
		Namespace:        namespace,
		DependencyUpdate: true,
		ValuesYaml:       yaml,
		ValuesOptions: values.Options{
			Values: opts.OverrideValues,
		},
	}

	helmClient, err := Client(namespace, opts.Verbose)
	if err != nil {
		return "", err
	}

	release, err := helmClient.TemplateChart(&chartSpec, &helmclient.HelmTemplateOptions{})
	if err != nil {
		return "", err
	}

	if !opts.Verbose {
		defer os.RemoveAll(templatePath)
	} else {
		fmt.Fprintf(os.Stderr, "Template directory: %s\n", templatePath)
	}

	return string(release), nil
}
