package fe

import (
	"fmt"
	"math/rand"
	"os"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/fe/compiler"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/fe/parser"
	"lunchpail.io/pkg/fe/template"
	"lunchpail.io/pkg/fe/transformer"
	"lunchpail.io/pkg/ir"
)

type CompileOptions struct {
	linker.ConfigureOptions
	DryRun         bool
	Watch          bool
	UseThisRunName string
}

func Compile(backend be.Backend, opts CompileOptions) (ir.Linked, error) {
	stageOpts := compiler.StageOptions{}
	stageOpts.Verbose = opts.Verbose
	compilationName, templatePath, _, err := compiler.Stage(stageOpts)
	if err != nil {
		return ir.Linked{}, err
	}

	namespace := opts.CompilationOptions.Namespace
	if namespace == "" {
		namespace = compilationName
	}

	runname := opts.UseThisRunName
	if runname == "" {
		if generatedRunname, err := linker.GenerateRunName(compilationName); err != nil {
			return ir.Linked{}, err
		} else {
			runname = generatedRunname
		}
	}

	internalS3Port := rand.Intn(65536) + 1
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using internal S3 port %d\n", internalS3Port)
	}

	yamlValues, dashdashSetValues, dashdashSetFileValues, queueSpec, err := linker.Configure(compilationName, runname, namespace, templatePath, internalS3Port, backend, opts.ConfigureOptions)
	if err != nil {
		return ir.Linked{}, err
	}

	defer os.RemoveAll(templatePath)
	if yaml, err := template.Template(runname, namespace, templatePath, yamlValues, template.TemplateOptions{OverrideValues: dashdashSetValues, OverrideFileValues: dashdashSetFileValues, Verbose: opts.Verbose}); err != nil {
		return ir.Linked{}, err
	} else if hlir, err := parser.Parse(yaml); err != nil {
		return ir.Linked{}, err
	} else if llir, err := transformer.Lower(compilationName, runname, namespace, hlir, queueSpec, yamlValues, opts.ConfigureOptions.CompilationOptions, opts.Verbose); err != nil {
		return ir.Linked{}, err
	} else {
		return ir.Linked{
			Runname:   runname,
			Namespace: namespace,
			Ir:        llir,
			Options:   opts.ConfigureOptions.CompilationOptions,
		}, nil
	}
}
