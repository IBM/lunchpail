package shrinkwrap

import (
	"embed"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/kirsle/configdir"
	"github.com/mittwald/go-helm-client"
	"github.com/mittwald/go-helm-client/values"
	// "helm.sh/helm/v3/pkg/chartutil"
	//	"github.com/go-git/go-git/v5"
)

type CoreOptions struct {
	Namespace          string
	ClusterIsOpenShift bool
	NeedsCsiH3         bool
	NeedsCsiS3         bool
	NeedsCsiNfs        bool
	HasGpuSupport      bool
	DockerHost         string
	OverrideValues     []string
	ImagePullSecret    string
	Verbose            bool
}

// instead we do this below: helm dependency update ../../templates/core
//
//go:generate /bin/sh -c "tar --exclude './charts/*.tgz' --exclude '*~' --exclude '*README.md' -C ../../templates/core -zcf core.tar.gz  ."
//go:embed core.tar.gz
var coreTemplate embed.FS

func stageCoreTemplate() (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := expand(dir, coreTemplate, "core.tar.gz"); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}

func GenerateCoreYaml(outputPath string, opts CoreOptions) error {
	sourcePath, err := stageCoreTemplate()
	if err != nil {
		return err
	}
	defer os.RemoveAll(sourcePath)

	fmt.Printf("Shrinkwrapping core templates=%s namespace=%s output=%v\n", sourcePath, opts.Namespace, outputPath)

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
      create: true
    context:
      name: ""
  s3Endpoint: http://s3.%v.svc.cluster.local:9000 # namespace (11)
  s3AccessKey: lunchpail
  s3SecretKey: lunchpail
dlf-chart:
  csi-h3-chart:
    enabled: %v # needsCsiH3 (12)
  csi-s3-chart:
    enabled: %v # needsCsiS3 (13)
  csi-nfs-chart:
    enabled: %v # needsCsiNFS (14)
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
		opts.Namespace,      // (11)
		opts.NeedsCsiH3,     // (12)
		opts.NeedsCsiS3,     // (13)
		opts.NeedsCsiNfs,    // (14)
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
		UpgradeCRDs:      true,
		Wait:             true,
		ValuesYaml:       yaml,
		ValuesOptions:    values.Options{Values: opts.OverrideValues},
	}

	helmCacheDir := configdir.LocalCache("helm")
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using Helm repository cache=%s\n", helmCacheDir)
	}

	helmClient, newClientErr := helmclient.New(&helmclient.Options{
		RepositoryCache: helmCacheDir,
	})
	if newClientErr != nil {
		return newClientErr
	}

	if res, err := helmClient.TemplateChart(&chartSpec, &helmclient.HelmTemplateOptions{}); err != nil {
		return err
	} else {
		if err := os.WriteFile(filepath.Join(outputPath, "00-core.yml"), res, 0644); err != nil {
			return err
		}
	}

	return nil
}
