package fe

import (
	"fmt"
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

type Linked struct {
	Runname   string
	Namespace string
	Ir        ir.LLIR
}

func Compile(opts CompileOptions) (Linked, error) {
	stageOpts := assembler.StageOptions{}
	stageOpts.Verbose = opts.Verbose
	assemblyName, templatePath, err := assembler.Stage(stageOpts)
	if err != nil {
		return Linked{}, err
	}

	namespace := opts.AssemblyOptions.Namespace
	if namespace == "" {
		namespace = assemblyName
	}

	runname := opts.UseThisRunName
	if runname == "" {
		if generatedRunname, err := linker.GenerateRunName(assemblyName); err != nil {
			return Linked{}, err
		} else {
			runname = generatedRunname
		}
	}

	internalS3Port := rand.Intn(65536) + 1
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using internal S3 port %d\n", internalS3Port)
	}

	yamlValues, dashdashSetValues, queueSpec, err := linker.Configure(assemblyName, runname, namespace, templatePath, internalS3Port, opts.ConfigureOptions)
	if err != nil {
		return Linked{}, err
	}

	if yaml, err := linker.Template(runname, namespace, templatePath, yamlValues, linker.TemplateOptions{OverrideValues: dashdashSetValues, Verbose: opts.Verbose}); err != nil {
		return Linked{}, err
	} else if hlir, err := parser.Parse(yaml); err != nil {
		return Linked{}, err
	} else if llir, err := transformer.Lower(assemblyName, runname, namespace, hlir, queueSpec, opts.Verbose); err != nil {
		return Linked{}, err
	} else {
		return Linked{
			runname,
			namespace,
			llir,
		}, nil
	}
}
