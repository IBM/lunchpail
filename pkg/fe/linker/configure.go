package linker

import (
	"fmt"
	"os"
	"os/user"
	"slices"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/util"
)

type ConfigureOptions struct {
	CompilationOptions compilation.Options
	Verbose            bool
}

func Configure(appname, runname, namespace, templatePath string, internalS3Port int, backend be.Backend, opts ConfigureOptions) (string, []string, []string, queue.Spec, string, error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory %s\n", templatePath)
	}

	shrinkwrappedOptions, err := compilation.RestoreOptions(templatePath)
	if err != nil {
		return "", nil, nil, queue.Spec{}, "", err
	} else {
		if opts.CompilationOptions.Namespace == "" {
			opts.CompilationOptions.Namespace = shrinkwrappedOptions.Namespace
		}
		// TODO here... how do we determine that boolean values were unset?
		if opts.CompilationOptions.ImagePullSecret == "" {
			opts.CompilationOptions.ImagePullSecret = shrinkwrappedOptions.ImagePullSecret
		}

		// careful: `--set x=3 --set x=4` results in x having
		// value 4, so we need to place the shrinkwrapped
		// options first in the list
		opts.CompilationOptions.OverrideValues = append(shrinkwrappedOptions.OverrideValues, opts.CompilationOptions.OverrideValues...)
		opts.CompilationOptions.OverrideFileValues = append(shrinkwrappedOptions.OverrideFileValues, opts.CompilationOptions.OverrideFileValues...)

		if opts.CompilationOptions.Queue == "" {
			opts.CompilationOptions.Queue = shrinkwrappedOptions.Queue
		}
		// TODO here... how do we determine that boolean values were unset?
		if opts.CompilationOptions.HasGpuSupport == false {
			opts.CompilationOptions.HasGpuSupport = shrinkwrappedOptions.HasGpuSupport
		}
		if !opts.CompilationOptions.CreateNamespace {
			opts.CompilationOptions.CreateNamespace = shrinkwrappedOptions.CreateNamespace
		}
	}

	systemNamespace := namespace

	queueSpec, err := queue.ParseFlag(opts.CompilationOptions.Queue, runname, internalS3Port)
	if err != nil {
		return "", nil, nil, queue.Spec{}, "", err
	}

	imagePullSecretName, dockerconfigjson, ipsErr := imagePullSecret(opts.CompilationOptions.ImagePullSecret)
	if ipsErr != nil {
		return "", nil, nil, queue.Spec{}, "", ipsErr
	}

	user, err := user.Current()
	if err != nil {
		return "", nil, nil, queue.Spec{}, "", err
	}

	// the app.kubernetes.io/part-of label value
	partOf := appname

	if queueSpec.Endpoint == "" {
		// see charts/workstealer/templates/s3/service... the hostname of the service has a max length
		runnameMax53 := util.Dns1035(runname + "-minio")
		queueSpec.Endpoint = fmt.Sprintf("http://%s.%s.svc.cluster.local:%d", runnameMax53, systemNamespace, internalS3Port)
		queueSpec.AccessKey = "lunchpail"
		queueSpec.SecretKey = "lunchpail"
	}
	if queueSpec.Bucket == "" {
		queueSpec.Bucket = queueSpec.Name
	}

	backendValues, err := backend.Values()
	if err != nil {
		return "", nil, nil, queue.Spec{}, "", err
	}

	serviceAccount := runname
	if !backendValues.NeedsServiceAccount && imagePullSecretName == "" {
		serviceAccount = ""
	}

	yaml := fmt.Sprintf(`
global:
  jaas:
    ips: %s # imagePullSecretName (3)
    dockerconfigjson: %s # dockerconfigjson (4)
    namespace:
      name: %v # systemNamespace (5)
      create: %v # opts.CreateNamespace (6)
username: %s # user.Username (10)
uid: %s # user.Uid (11)
rbac:
  serviceaccount: %s # serviceAccount (12)
partOf: %s # partOf (16)
taskqueue:
  auto: %v # queueSpec.Auto (17)
  dataset: %s # queueSpec.Name (18)
  endpoint: %s # queueSpec.Endpoint (19)
  bucket: %s # queueSpec.Bucket (20)
  accessKey: %s # queueSpec.AccessKey (21)
  secretKey: %s # queueSpec.SecretKey (22)
name: %s # runname (23)
namespace:
  user: %s # namespace (24)
`,
		imagePullSecretName,                     // (3)
		dockerconfigjson,                        // (4)
		systemNamespace,                         // (5)
		opts.CompilationOptions.CreateNamespace, // (6)

		user.Username,       // (10)
		user.Uid,            // (11)
		serviceAccount,      // (12)
		partOf,              // (16)
		queueSpec.Auto,      // (17)
		queueSpec.Name,      // (18)
		queueSpec.Endpoint,  // (19)
		queueSpec.Bucket,    // (20)
		queueSpec.AccessKey, // (21)
		queueSpec.SecretKey, // (22)
		runname,             // (23)
		namespace,           // (24)
	)

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "shrinkwrap app values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.CompilationOptions.OverrideValues)
		fmt.Fprintf(os.Stderr, "shrinkwrap app file overrides=%v\n", opts.CompilationOptions.OverrideFileValues)
		fmt.Fprintf(os.Stderr, "shrinkwrap backend overrides=%v\n", backendValues)
	}

	overrides := slices.Concat(opts.CompilationOptions.OverrideValues, backendValues.Kv)
	fileOverrides := opts.CompilationOptions.OverrideFileValues // Note: no backend value support here

	return yaml, overrides, fileOverrides, queueSpec, serviceAccount, nil
}
