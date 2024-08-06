package fe

import (
	"fmt"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/fe/assembler"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/fe/parser"
	"lunchpail.io/pkg/fe/transformer"
	"lunchpail.io/pkg/ir"
	"math/rand"
	"os"
)

type CompileOptions struct {
	linker.ConfigureOptions
	DryRun         bool
	Watch          bool
	UseThisRunName string
}

func Compile(backend be.Backend, opts CompileOptions) (ir.Linked, error) {
	stageOpts := assembler.StageOptions{}
	stageOpts.Verbose = opts.Verbose
	assemblyName, templatePath, _, err := assembler.Stage(stageOpts)
	if err != nil {
		return ir.Linked{}, err
	}

	namespace := opts.AssemblyOptions.Namespace
	if namespace == "" {
		namespace = assemblyName
	}

	runname := opts.UseThisRunName
	if runname == "" {
		if generatedRunname, err := linker.GenerateRunName(assemblyName); err != nil {
			return ir.Linked{}, err
		} else {
			runname = generatedRunname
		}
	}

	internalS3Port := rand.Intn(65536) + 1
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using internal S3 port %d\n", internalS3Port)
	}

	yamlValues, dashdashSetValues, dashdashSetFileValues, repoSecrets, queueSpec, err := linker.Configure(assemblyName, runname, namespace, templatePath, internalS3Port, backend, opts.ConfigureOptions)
	if err != nil {
		return ir.Linked{}, err
	}

	defer os.RemoveAll(templatePath)
	if yaml, err := linker.Template(runname, namespace, templatePath, yamlValues, linker.TemplateOptions{OverrideValues: dashdashSetValues, OverrideFileValues: dashdashSetFileValues, Verbose: opts.Verbose}); err != nil {
		return ir.Linked{}, err
	} else if hlir, err := parser.Parse(yaml, repoSecrets); err != nil {
		return ir.Linked{}, err
	} else if llir, err := transformer.Lower(assemblyName, runname, namespace, hlir, queueSpec, opts.ConfigureOptions.AssemblyOptions, opts.Verbose); err != nil {
		return ir.Linked{}, err
	} else {
		return ir.Linked{
			Runname:   runname,
			Namespace: namespace,
			Ir:        llir,
			Options:   opts.ConfigureOptions.AssemblyOptions,
		}, nil
	}
}
