package linker

import (
	"fmt"
	"os"
	"os/user"

	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/lunchpail"
)

type ConfigureOptions struct {
	Namespace          string
	ClusterIsOpenShift bool
	ImagePullSecret    string
	OverrideValues     []string
	Verbose            bool
	Queue              string
	HasGpuSupport      bool
	DockerHost         string
	CreateNamespace    bool
}

func Configure(appname, runname, namespace, templatePath string, internalS3Port int, opts ConfigureOptions) (string, []string, queue.Spec, error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory %s\n", templatePath)
	}

	shrinkwrappedOptions, err := lunchpail.RestoreAppOptions(templatePath)
	if err != nil {
		return "", []string{}, queue.Spec{}, err
	} else {
		// TODO here... how do we determine that boolean values were unset?
		if opts.Namespace == "" {
			opts.Namespace = shrinkwrappedOptions.Namespace
		}
		if opts.ImagePullSecret == "" {
			opts.ImagePullSecret = shrinkwrappedOptions.ImagePullSecret
		}

		// careful: `--set x=3 --set x=4` results in x having
		// value 4, so we need to place the shrinkwrapped
		// options first in the list
		opts.OverrideValues = append(shrinkwrappedOptions.OverrideValues, opts.OverrideValues...)

		if opts.Queue == "" {
			opts.Queue = shrinkwrappedOptions.Queue
		}
		if opts.DockerHost == "" {
			opts.DockerHost = shrinkwrappedOptions.DockerHost
		}
	}

	systemNamespace := namespace

	clusterType := "k8s"
	imageRegistry := "ghcr.io"
	imageRepo := "lunchpail"

	if opts.ClusterIsOpenShift {
		clusterType = "oc"
	}

	queueSpec, err := queue.ParseFlag(opts.Queue, runname, internalS3Port)
	if err != nil {
		return "", []string{}, queue.Spec{}, err
	}

	imagePullSecretName, dockerconfigjson, ipsErr := imagePullSecret(opts.ImagePullSecret)
	if ipsErr != nil {
		return "", []string{}, queue.Spec{}, ipsErr
	}

	user, err := user.Current()
	if err != nil {
		return "", []string{}, queue.Spec{}, err
	}

	// the app.kubernetes.io/part-of label value
	partOf := appname

	yaml := fmt.Sprintf(`
global:
  type: %s # clusterType (1)
  dockerHost: %s # dockerHost (2)
  rbac:
    serviceaccount: %s # runname (3)
    runAsRoot: false
  image:
    registry: %s # imageRegistry (4)
    repo: %s # imageRepo (5)
  jaas:
    ips: %s # imagePullSecretName (6)
    dockerconfigjson: %s # dockerconfigjson (7)
    namespace:
      name: %v # systemNamespace (8)
      create: %v # opts.CreateNamespace (9)
    context:
      name: ""
  s3Endpoint: http://%s-s3.%s.svc.cluster.local:%d # runname (10) systemNamespace (11) internalS3Port (12)
  s3AccessKey: lunchpail
  s3SecretKey: lunchpail
lunchpail: lunchpail
username: %s # user.Username (13)
uid: %s # user.Uid (14)
mcad:
  enabled: false
rbac:
  serviceaccount: %s # runname (15)
image:
  registry: %s # imageRegistry (16)
  repo: %s # imageRepo (17)
  version: %v # lunchpail.Version() (18)
partOf: %s # partOf (19)
taskqueue:
  auto: %v # queueSpec.Auto (20)
  dataset: %s # queueSpec.Name (21)
  endpoint: %s # queueSpec.Endpoint (22)
  bucket: %s # queueSpec.Bucket (23)
  accessKey: %s # queueSpec.AccessKey (24)
  secretKey: %s # queueSpec.SecretKey (25)
name: %s # runname (26)
namespace:
  user: %s # namespace (27)
tags:
  gpu: %v # hasGpuSupport (28)
s3:
  name: %s # runname (29)
  port: %d # internalS3Port (30)
  appname: %s # appname (31)
`,
		clusterType,          // (1)
		opts.DockerHost,      // (2)
		runname,              // (3)
		imageRegistry,        // (4)
		imageRepo,            // (5)
		imagePullSecretName,  // (6)
		dockerconfigjson,     // (7)
		systemNamespace,      // (8)
		opts.CreateNamespace, // (9)

		runname,             // (10)
		systemNamespace,     // (11)
		internalS3Port,      // (12)
		user.Username,       // (13)
		user.Uid,            // (14)
		runname,             // (15)
		imageRegistry,       // (16)
		imageRepo,           // (17)
		lunchpail.Version(), // (18)
		partOf,              // (19)
		queueSpec.Auto,      // (20)
		queueSpec.Name,      // (21)
		queueSpec.Endpoint,  // (22)
		queueSpec.Bucket,    // (23)
		queueSpec.AccessKey, // (24)
		queueSpec.SecretKey, // (25)
		runname,             // (26)
		namespace,           // (27)
		opts.HasGpuSupport,  // (28)
		runname,             // (29)
		internalS3Port,      // (30)
		appname,             // (31)
	)

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "shrinkwrap app values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.OverrideValues)
	}

	return yaml, opts.OverrideValues, queueSpec, nil
}
