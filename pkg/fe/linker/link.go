package linker

import (
	"fmt"
	"lunchpail.io/pkg/fe/assembler"
	"lunchpail.io/pkg/fe/linker/helm"
	"lunchpail.io/pkg/fe/linker/yaml"
	"lunchpail.io/pkg/fe/linker/yaml/queue"
	"lunchpail.io/pkg/ir"
	"math/rand"
	"os"
)

type LinkOptions struct {
	yaml.GenerateOptions
	DryRun bool
	Watch  bool
}

type Linked struct {
	Runname   string
	Namespace string
	Ir        ir.LLIR
}

func Link(opts LinkOptions) (Linked, error) {
	assemblyName, templatePath, err := assembler.Stage(assembler.StageOptions{"", opts.Verbose})
	if err != nil {
		return Linked{}, err
	}

	namespace := opts.Namespace
	if namespace == "" {
		namespace = assemblyName
	}

	runname, err := autorunName(assemblyName)
	if err != nil {
		return Linked{}, err
	}

	internalS3Port := rand.Intn(65536) + 1
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using internal S3 port %d\n", internalS3Port)
	}

	queueSpec, err := queue.ParseFlag(opts.Queue, runname, internalS3Port)
	if err != nil {
		return Linked{}, err
	}

	runname, yaml, overrideValues, err := yaml.Generate(assemblyName, runname, namespace, templatePath, internalS3Port, queueSpec, opts.GenerateOptions)
	if err != nil {
		return Linked{}, err
	}

	if yaml, err := helm.Template(runname, namespace, templatePath, yaml, helm.TemplateOptions{overrideValues, opts.Verbose}); err != nil {
		return Linked{}, err
	} else if appModel, err := parse(yaml); err != nil {
		return Linked{}, err
	} else if linkedYaml, err := transform(assemblyName, runname, namespace, appModel, queueSpec, opts.Verbose); err != nil {
		return Linked{}, err
	} else {
		return Linked{
			runname,
			namespace,
			linkedYaml,
		}, nil
	}
}
