package linker

import (
	"fmt"
	"os"
	"os/user"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/lunchpail"
)

func Configure(appname, runname, templatePath string, internalS3Port int, opts compilation.Options) (string, []string, []string, queue.Spec, error) {
	if opts.Log.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory for runname=%s is %s\n", runname, templatePath)
	}

	queueSpec, err := queue.ParseFlag(opts.Queue, runname, internalS3Port)
	if err != nil {
		return "", nil, nil, queue.Spec{}, err
	}

	user, err := user.Current()
	if err != nil {
		return "", nil, nil, queue.Spec{}, err
	}

	if queueSpec.Endpoint == "" {
		// see charts/workstealer/templates/s3/service... the hostname of the service has a max length
		queueSpec.Auto = true
		queueSpec.Port = internalS3Port
		queueSpec.Endpoint = fmt.Sprintf("localhost:%d", internalS3Port)
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

	if opts.Log.Verbose {
		fmt.Fprintf(os.Stderr, "shrinkwrap app values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.OverrideValues)
		fmt.Fprintf(os.Stderr, "shrinkwrap app file overrides=%v\n", opts.OverrideFileValues)
	}

	overrides := opts.OverrideValues
	fileOverrides := opts.OverrideFileValues

	return yaml, overrides, fileOverrides, queueSpec, nil
}
