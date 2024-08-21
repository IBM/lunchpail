package linker

import (
	"fmt"
	"os"
	"os/user"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
)

type ConfigureOptions struct {
	CompilationOptions compilation.Options
	Verbose            bool
}

func Configure(appname, runname, namespace, templatePath string, internalS3Port int, backend be.Backend, opts ConfigureOptions) (string, []string, []string, queue.Spec, error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory %s\n", templatePath)
	}

	shrinkwrappedOptions, err := compilation.RestoreOptions(templatePath)
	if err != nil {
		return "", nil, nil, queue.Spec{}, err
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
		return "", nil, nil, queue.Spec{}, err
	}

	user, err := user.Current()
	if err != nil {
		return "", nil, nil, queue.Spec{}, err
	}

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

	yaml := fmt.Sprintf(`
lunchpail:
  user:
    name: %s # user.Username (10)
    uid: %s # user.Uid (11)
  image:
    registry: %s # (12)
    repo: %s # (13)
    version: %s # (14)
  name: %s # runname (23)
  partOf: %s # appname (16)
`,
		user.Username,           // (10)
		user.Uid,                // (11)
		lunchpail.ImageRegistry, // (12)
		lunchpail.ImageRepo,     // (13)
		lunchpail.Version(),     // (14)
		runname,                 // (23)
		appname,                 // (16)
	)

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "shrinkwrap app values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.CompilationOptions.OverrideValues)
		fmt.Fprintf(os.Stderr, "shrinkwrap app file overrides=%v\n", opts.CompilationOptions.OverrideFileValues)
	}

	overrides := opts.CompilationOptions.OverrideValues
	fileOverrides := opts.CompilationOptions.OverrideFileValues

	return yaml, overrides, fileOverrides, queueSpec, nil
}
