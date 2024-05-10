package shrinkwrap

import (
	"lunchpail.io/pkg/shrinkwrap/status"
)

type UpOptions struct {
	AppOptions
	Watch bool
}

func Up(opts UpOptions) error {
	appname, templatePath, err := stageFromAssembled(StageOptions{"", opts.Verbose})
	if err != nil {
		return err
	}

	namespace := opts.Namespace
	if namespace == "" {
		namespace = appname
	}

	// If we were asked to watch, then the status.UI will do the
	// waiting for us. Otherwise, ask the helm client to wait for
	// readiness.
	wait := !opts.Watch

	runname, err := generateAppYaml(appname, namespace, templatePath, wait, opts.AppOptions)
	if err != nil {
		return err
	}

	if opts.Watch {
		return status.UI(runname, status.Options{namespace, true, opts.Verbose})
	}

	return nil
}
