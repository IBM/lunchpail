package shrinkwrap

import (
	"lunchpail.io/pkg/fe/app"
	"lunchpail.io/pkg/fe/linker/yaml"
	"lunchpail.io/pkg/fe/linker/helm"
	"lunchpail.io/pkg/shrinkwrap/status"
)

type UpOptions struct {
	yaml.GenerateOptions
	Watch bool
}

func Up(opts UpOptions) error {
	appname, templatePath, err := app.Stage(app.StageOptions{"", opts.Verbose})
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

	runname, yaml, overrideValues, err := yaml.Generate(appname, namespace, templatePath, opts.GenerateOptions)
	if err != nil {
		return err
	}

	if err := helm.Install(runname, namespace, templatePath, yaml, helm.InstallOptions{overrideValues, wait, opts.DryRun, opts.Verbose}); err != nil {
		return err
	}

	if opts.Watch && !opts.GenerateOptions.DryRun {
		return status.UI(runname, status.Options{namespace, true, opts.Verbose, false, 500, 5})
	}

	return nil
}
