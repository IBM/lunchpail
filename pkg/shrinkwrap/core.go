package shrinkwrap

import (
	"embed"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/mittwald/go-helm-client"
	"github.com/mittwald/go-helm-client/values"
	// "helm.sh/helm/v3/pkg/chartutil"
	//	"github.com/go-git/go-git/v5"
)

type CoreOptions struct {
	Namespace          string
	Max                bool
	ClusterIsOpenShift bool
	NeedsCsiH3         bool
	NeedsCsiS3         bool
	NeedsCsiNfs        bool
	HasGpuSupport      bool
	DockerHost         string
	OverrideValues     []string
}

// instead we do this below: helm dependency update ../../templates/core
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

func Core(outputPath string, opts CoreOptions) error {
	sourcePath, err := stageCoreTemplate()
	if err != nil {
		return err
	}
	defer os.RemoveAll(sourcePath)

	fmt.Printf("Shrinkwrapping core templates=%s max=%v namespace=%s output=%v\n", sourcePath, opts.Max, opts.Namespace, outputPath)

	mcadEnabled := opts.Max
	clusterName := "lunchpail"

	imageRegistry := "ghcr.io"
	imageRepo := "lunchpail"

	runAsRoot := false // the core doesn't need/support this

	clusterType := "k8s"
	if opts.ClusterIsOpenShift {
		clusterType = "oc"
	}

	yaml := fmt.Sprintf(`
tags:
  gpu: %v # hasGpuSupport (1)
  full: %v # max (2)
  core: true
mcad:
  enabled: %v # mcadEnabled (3)
jaas-core:
  lunchpail: lunchpail
  mcad:
    enabled: %v # mcadEnabled (4)
global:
  lite: %v # !max (5)
  type: %s # clusterType (6)
  dockerHost: %s # dockerHost (7)
  image:
    registry: %s # imageRegistry (8)
    repo: %s # imageRepo (9)
  rbac:
    serviceaccount: %s # clusterName (10)
    runAsRoot: %v # runAsRoot (11)
  jaas:
    ips: lunchpail-image-pull-secret
    namespace:
      name: %v # namespace (12)
      create: true
    context:
      name: ""
  s3Endpoint: http://s3.%v.svc.cluster.local:9000 # namespace (13)
  s3AccessKey: lunchpail
  s3SecretKey: lunchpail
dlf-chart:
  csi-h3-chart:
    enabled: %v # needsCsiH3 (14)
  csi-s3-chart:
    enabled: %v # needsCsiS3 (15)
  csi-nfs-chart:
    enabled: %v # needsCsiNFS (16)
mcad-controller:
  namespace: %v # namespace (17)
`,
		opts.HasGpuSupport,           // (1)
		opts.Max,                     // (2)
		mcadEnabled,                  // (3)
		mcadEnabled,                  // (4)
		!opts.Max,                    // (5)
		clusterType,                  // (6)
		opts.DockerHost,              // (7)
		imageRegistry,                // (8)
		imageRepo,                    // (9)
		clusterName,                  // (10)
		runAsRoot,                    // (11)
		opts.Namespace,               // (12)
		opts.Namespace,               // (13)
		opts.Max || opts.NeedsCsiH3,  // (14)
		opts.Max || opts.NeedsCsiS3,  // (15)
		opts.Max || opts.NeedsCsiNfs, // (16)
		opts.Namespace,               // (17)
	)

	if os.Getenv("CI") != "" {
		fmt.Fprintf(os.Stderr, "shrinkwrap core values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap core overrides=%v\n", opts.OverrideValues)
	}

	chartSpec := helmclient.ChartSpec{
		ReleaseName:   "lunchpail-core",
		ChartName:     sourcePath,
		DependencyUpdate: true,
		Namespace:     opts.Namespace,
		UpgradeCRDs:   true,
		Wait:          true,
		ValuesYaml:    yaml,
		ValuesOptions: values.Options{Values: opts.OverrideValues},
	}

	helmClient, newClientErr := helmclient.New(&helmclient.Options{})
	if newClientErr != nil {
		return newClientErr
	}

	if res, err := helmClient.TemplateChart(&chartSpec, &helmclient.HelmTemplateOptions{}); err != nil {
		return err
	} else if outputPath == "-" {
		fmt.Printf("res: %v\n", string(res))
	} else {
		if err := os.WriteFile(outputPath, res, 0644); err != nil {
			return err
		}

		nsPath := filepath.Join(
			filepath.Dir(outputPath),
			strings.TrimSuffix(filepath.Base(outputPath), filepath.Ext(outputPath))+".namespace",
		)
		if err := os.WriteFile(nsPath, []byte(opts.Namespace), 0644); err != nil {
			return err
		}
	}

	return nil
}
