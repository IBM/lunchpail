package shrinkwrap

import (
	"context"
	"embed"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"github.com/kirsle/configdir"
	"github.com/mittwald/go-helm-client"
	"github.com/mittwald/go-helm-client/values"
	// "helm.sh/helm/v3/pkg/chartutil"
	//	"github.com/go-git/go-git/v5"
)

type CoreOptions struct {
	Namespace          string
	ClusterIsOpenShift bool
	HasGpuSupport      bool
	DockerHost         string
	OverrideValues     []string
	ImagePullSecret    string
	Verbose            bool
	DryRun             bool
}

//go:generate /bin/sh -c "[ -d ../../charts/core ] && tar --exclude './charts/*.tgz' --exclude '*~' --exclude '*README.md' -C ../../charts/core -zcf core.tar.gz . || exit 0"
//go:embed core.tar.gz
var coreTemplate embed.FS

func stageCoreTemplate() (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := Expand(dir, coreTemplate, "core.tar.gz", false); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}

func generateCoreYaml(opts CoreOptions) error {
	sourcePath, err := stageCoreTemplate()
	if err != nil {
		return err
	}
	defer os.RemoveAll(sourcePath)

	if opts.Verbose {
		fmt.Printf("Shrinkwrapping core templates=%s namespace=%s\n", sourcePath, opts.Namespace)
	}

	clusterName := "lunchpail"

	imageRegistry := "ghcr.io"
	imageRepo := "lunchpail"

	runAsRoot := false // the core doesn't need/support this

	clusterType := "k8s"
	if opts.ClusterIsOpenShift {
		clusterType = "oc"
	}

	imagePullSecretName, dockerconfigjson, ipsErr := ImagePullSecret(opts.ImagePullSecret)
	if ipsErr != nil {
		return ipsErr
	}

	yaml := fmt.Sprintf(`
tags:
  gpu: %v # hasGpuSupport (1)
  core: true
jaas-core:
  lunchpail: lunchpail
global:
  type: %s # clusterType (2)
  dockerHost: %s # dockerHost (3)
  image:
    registry: %s # imageRegistry (4)
    repo: %s # imageRepo (5)
  rbac:
    serviceaccount: %s # clusterName (6)
    runAsRoot: %v # runAsRoot (7)
  jaas:
    ips: %s # imagePullSecretName (8)
    dockerconfigjson: %s # dockerconfigjson (9)
    namespace:
      name: %v # namespace (10)
      create: %v # !opts.DryRun (11)
    context:
      name: ""
  s3Endpoint: http://s3.%v.svc.cluster.local:9000 # namespace (12)
  s3AccessKey: lunchpail
  s3SecretKey: lunchpail
`,
		opts.HasGpuSupport,  // (1)
		clusterType,         // (2)
		opts.DockerHost,     // (3)
		imageRegistry,       // (4)
		imageRepo,           // (5)
		clusterName,         // (6)
		runAsRoot,           // (7)
		imagePullSecretName, // (8)
		dockerconfigjson,    // (9)
		opts.Namespace,      // (10)
		opts.DryRun,         // (11)
		opts.Namespace,      // (12)
	)

	if opts.Verbose || os.Getenv("CI") != "" {
		fmt.Fprintf(os.Stderr, "shrinkwrap core values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap core overrides=%v\n", opts.OverrideValues)
	}

	chartSpec := helmclient.ChartSpec{
		ReleaseName:      "lunchpail-core",
		ChartName:        sourcePath,
		DependencyUpdate: true,
		Namespace:        opts.Namespace,
		CreateNamespace:  !opts.DryRun,
		UpgradeCRDs:      true,
		Wait:             true,
		Timeout:          360 * time.Second,
		ValuesYaml:       yaml,
		ValuesOptions:    values.Options{Values: opts.OverrideValues},
	}

	helmCacheDir := configdir.LocalCache("helm")
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using Helm repository cache=%s\n", helmCacheDir)
	}

	outputOfHelmCmd := ioutil.Discard
	if opts.Verbose {
		outputOfHelmCmd = os.Stdout
	}

	helmClient, newClientErr := helmclient.New(&helmclient.Options{
		Namespace:       opts.Namespace,
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

	return nil
}
