package linker

import (
	"fmt"
	"os"
	"os/user"
	"slices"

	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/lunchpail"
)

type ConfigureOptions struct {
	AssemblyOptions assembly.Options
	CreateNamespace bool
	Verbose         bool
}

func Configure(appname, runname, namespace, templatePath string, internalS3Port int, opts ConfigureOptions) (string, []string, []hlir.RepoSecret, queue.Spec, error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory %s\n", templatePath)
	}

	shrinkwrappedOptions, err := assembly.RestoreOptions(templatePath)
	if err != nil {
		return "", []string{}, nil, queue.Spec{}, err
	} else {
		if opts.AssemblyOptions.Namespace == "" {
			opts.AssemblyOptions.Namespace = shrinkwrappedOptions.Namespace
		}
		// TODO here... how do we determine that boolean values were unset?
		if opts.AssemblyOptions.ClusterIsOpenShift == false {
			opts.AssemblyOptions.ClusterIsOpenShift = shrinkwrappedOptions.ClusterIsOpenShift
		}
		if opts.AssemblyOptions.ImagePullSecret == "" {
			opts.AssemblyOptions.ImagePullSecret = shrinkwrappedOptions.ImagePullSecret
		}

		// careful: `--set x=3 --set x=4` results in x having
		// value 4, so we need to place the shrinkwrapped
		// options first in the list
		opts.AssemblyOptions.OverrideValues = append(shrinkwrappedOptions.OverrideValues, opts.AssemblyOptions.OverrideValues...)

		if opts.AssemblyOptions.Queue == "" {
			opts.AssemblyOptions.Queue = shrinkwrappedOptions.Queue
		}
		// TODO here... how do we determine that boolean values were unset?
		if opts.AssemblyOptions.HasGpuSupport == false {
			opts.AssemblyOptions.HasGpuSupport = shrinkwrappedOptions.HasGpuSupport
		}
		if opts.AssemblyOptions.DockerHost == "" {
			opts.AssemblyOptions.DockerHost = shrinkwrappedOptions.DockerHost
		}
	}

	systemNamespace := namespace

	clusterType := "k8s"
	imageRegistry := lunchpail.ImageRegistry
	imageRepo := lunchpail.ImageRepo

	if opts.AssemblyOptions.ClusterIsOpenShift {
		clusterType = "oc"
	}

	queueSpec, err := queue.ParseFlag(opts.AssemblyOptions.Queue, runname, internalS3Port)
	if err != nil {
		return "", []string{}, nil, queue.Spec{}, err
	}

	imagePullSecretName, dockerconfigjson, ipsErr := imagePullSecret(opts.AssemblyOptions.ImagePullSecret)
	if ipsErr != nil {
		return "", []string{}, nil, queue.Spec{}, ipsErr
	}

	user, err := user.Current()
	if err != nil {
		return "", []string{}, nil, queue.Spec{}, err
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
  enabled: %v # queueSpec.Auto (29)
  port: %d # internalS3Port (30)
lunchpail_internal:
  workstealer:
    sleep_before_exit: %s # sleepBeforeExit (31)
`,
		clusterType,                     // (1)
		opts.AssemblyOptions.DockerHost, // (2)
		runname,                         // (3)
		imageRegistry,                   // (4)
		imageRepo,                       // (5)
		imagePullSecretName,             // (6)
		dockerconfigjson,                // (7)
		systemNamespace,                 // (8)
		opts.CreateNamespace,            // (9)

		runname,                            // (10)
		systemNamespace,                    // (11)
		internalS3Port,                     // (12)
		user.Username,                      // (13)
		user.Uid,                           // (14)
		runname,                            // (15)
		imageRegistry,                      // (16)
		imageRepo,                          // (17)
		lunchpail.Version(),                // (18)
		partOf,                             // (19)
		queueSpec.Auto,                     // (20)
		queueSpec.Name,                     // (21)
		queueSpec.Endpoint,                 // (22)
		queueSpec.Bucket,                   // (23)
		queueSpec.AccessKey,                // (24)
		queueSpec.SecretKey,                // (25)
		runname,                            // (26)
		namespace,                          // (27)
		opts.AssemblyOptions.HasGpuSupport, // (28)
		queueSpec.Auto,                     // (29)
		internalS3Port,                     // (30)
		os.Getenv("LP_SLEEP_BEFORE_EXIT"),  // (31)
	)

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "shrinkwrap app values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.AssemblyOptions.OverrideValues)
	}

	repoSecrets, err := gatherRepoSecrets(slices.Concat(opts.AssemblyOptions.RepoSecrets, shrinkwrappedOptions.RepoSecrets))
	if err != nil {
		return "", []string{}, nil, queue.Spec{}, err
	}

	return yaml, opts.AssemblyOptions.OverrideValues, repoSecrets, queueSpec, nil
}
