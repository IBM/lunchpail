package helm

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"github.com/kirsle/configdir"
	"github.com/mittwald/go-helm-client"
	"github.com/mittwald/go-helm-client/values"
)

type InstallOptions struct {
	OverrideValues     []string
	Wait    bool
	DryRun  bool
	Verbose bool
}

func Install(runname, namespace, templatePath, yaml string, opts InstallOptions) error {
	chartSpec := helmclient.ChartSpec{
		ReleaseName:      runname,
		ChartName:        templatePath,
		Namespace:        namespace,
		Wait:             opts.Wait,
		UpgradeCRDs:      true,
		CreateNamespace:  !opts.DryRun,
		DependencyUpdate: true,
		Timeout:          360 * time.Second,
		ValuesYaml:       yaml,
		ValuesOptions: values.Options{
			Values: opts.OverrideValues,
		},
	}

	helmCacheDir := configdir.LocalCache("helm")
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using Helm repository cache=%s\n", helmCacheDir)
	}

	outputOfHelmCmd := ioutil.Discard
	if opts.Verbose {
		outputOfHelmCmd = os.Stdout
	}

	helmClient, newClientErr := helmclient.New(&helmclient.Options{Namespace: namespace,
		Output:          outputOfHelmCmd,
		RepositoryCache: helmCacheDir,
	})
	if newClientErr != nil {
		return newClientErr
	}

	if opts.DryRun {
		if res, err := helmClient.TemplateChart(&chartSpec, &helmclient.HelmTemplateOptions{}); err != nil {
			return err
		} else {
			fmt.Println(string(res))
		}
	} else if _, err := helmClient.InstallOrUpgradeChart(context.Background(), &chartSpec, nil); err != nil {
		return err
	}

	if !opts.Verbose {
		defer os.RemoveAll(templatePath)
	} else {
		fmt.Fprintf(os.Stderr, "Template directory: %s\n", templatePath)
	}

	return nil
}
