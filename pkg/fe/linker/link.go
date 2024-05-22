package linker

import (
	"lunchpail.io/pkg/fe/assembler"
	"lunchpail.io/pkg/fe/linker/helm"
	"lunchpail.io/pkg/fe/linker/yaml"
)

type LinkOptions struct {
	yaml.GenerateOptions
	DryRun bool
	Watch  bool
}

type Linked struct {
	Runname   string
	Namespace string
	Yaml      string
}

func Link(opts LinkOptions) (Linked, error) {
	appname, templatePath, err := assembler.Stage(assembler.StageOptions{"", opts.Verbose})
	if err != nil {
		return Linked{}, err
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
		return Linked{}, err
	}

	if yaml, err := helm.Template(runname, namespace, templatePath, yaml, helm.TemplateOptions{overrideValues, wait, opts.Verbose, !opts.DryRun, !opts.DryRun}); err != nil {
		return Linked{}, err
	} else {
		return Linked{
			runname,
			namespace,
			yaml,
		}, nil
	}
}
