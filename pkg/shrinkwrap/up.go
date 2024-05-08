package shrinkwrap

import (
	"lunchpail.io/pkg/shrinkwrap/qstat"
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

	if err := generateAppYaml(appname, namespace, templatePath, opts.AppOptions); err != nil {
		return err
	}

	if opts.Watch {
		return qstat.UI(qstat.Options{namespace, true, -1, opts.Verbose})
	}

	return nil
}
