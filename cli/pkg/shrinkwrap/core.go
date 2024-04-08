package shrinkwrap

import (
	"os"
	"fmt"

	
	"helm.sh/helm/v3/pkg/chartutil"
	"github.com/mittwald/go-helm-client"
	//	"github.com/go-git/go-git/v5"
)

type CoreOptions struct {
	Namespace string
	Max bool
	ClusterIsOpenShift bool
	NeedsCsiH3 bool
	NeedsCsiS3 bool
	NeedsCsiNfs bool
	HasGpuSupport bool
}

func Core(sourcePath, outputPath string, opts CoreOptions) {
	fileInfo, err := os.Stat(sourcePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Source path not found %s\n", sourcePath)
		os.Exit(1)
	}

	if !fileInfo.IsDir() {
		fmt.Fprintf(os.Stderr, "Source path not a directory %s\n", sourcePath)
		os.Exit(1)
	}

	fmt.Printf("Shrinkwrapping core %s\n", sourcePath)

	mcadEnabled := opts.Max
	clusterName := "lunchpail"

	imageRegistry := "ghcr.io"
	imageRepo := "lunchpail"

	runAsRoot := false // the core doesn't need/support this

	clusterType := "k8s"
	if opts.ClusterIsOpenShift {
		clusterType = "oc"
	}

	values := fmt.Sprintf(`
tags:
  gpu: %v # hasGpuSupport
  full: %v # max
  core: true
jaas-core:
  lunchpail: lunchpail
  mcad:
    enabled: %v # mcadEnabled
global:
  lite: %v # max
  type: %v # clusterType
  image:
    registry: %s # imageRegistry
    repo: %s # imageRepo
  rbac:
    serviceaccount: %s # clusterName
    runAsRoot: %v # runAsRoot
  jaas:
    ips: xxx
    namespace:
      name: %v # namespace
    context:
      name: ""
  s3Endpoint: http://s3.%v.svc.cluster.local:9000 # namespace
  s3AccessKey: jaas
  s3SecretKey: jaas
dlf-chart:
  csi-h3-chart:
    enabled: %v # needsCsiH3
  csi-s3-chart:
    enabled: %v # needsCsiS3
  csi-nfs-chart:
    enabled: %v # needsCsiNFS
mcad-controller:
  namespace: %v # namespace
`,
		opts.HasGpuSupport,
		opts.Max,
		mcadEnabled,
		opts.Max,
		clusterType,
		imageRegistry,
		imageRepo,
		clusterName,
		runAsRoot,
		opts.Namespace,
		opts.Namespace,
		opts.NeedsCsiH3,
		opts.NeedsCsiS3,
		opts.NeedsCsiNfs,
		opts.Namespace,
	)
	fmt.Fprintf(os.Stderr, "Using values=%s\n", values)

	chartSpec := helmclient.ChartSpec{
		ReleaseName: "jaas-core",
		ChartName:   sourcePath,
		Namespace:   opts.Namespace,
		UpgradeCRDs: true,
		Wait:        true,
		ValuesYaml: values,
	}

	options := &helmclient.HelmTemplateOptions{
		KubeVersion: &chartutil.KubeVersion{
			Version: "v1.23.10",
			Major:   "1",
			Minor:   "23",
		},
		APIVersions: []string{
			"helm.sh/v1/Test",
		},
	}

	helmClient, newClientErr := helmclient.New(&helmclient.Options{})
	if newClientErr != nil {
		fmt.Fprintf(os.Stderr, "%v\n", newClientErr)
		os.Exit(1)
	}

	if res, err := helmClient.TemplateChart(&chartSpec, options); err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	} else if outputPath == "-" {
		fmt.Printf("res: %v\n", string(res))
	} else {
		if err := os.WriteFile(outputPath, res, 0644); err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err)
			os.Exit(1)
		}
	}
}
