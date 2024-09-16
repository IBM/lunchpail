package fe

import (
	"fmt"
	"math/rand"
	"os"

	"lunchpail.io/pkg/be/helm"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/fe/parser"
	"lunchpail.io/pkg/fe/transformer"
	"lunchpail.io/pkg/ir/llir"
)

type CompileOptions struct {
	linker.ConfigureOptions
	DryRun         bool
	Watch          bool
	UseThisRunName string
}

func PrepareForRun(opts CompileOptions) (llir.LLIR, compilation.Options, error) {
	stageOpts := compilation.StageOptions{}
	stageOpts.Verbose = opts.Verbose
	compilationName, templatePath, _, err := compilation.Stage(stageOpts)
	if err != nil {
		return llir.LLIR{}, opts.CompilationOptions, err
	}

	runname := opts.UseThisRunName
	if runname == "" {
		if generatedRunname, err := linker.GenerateRunName(compilationName); err != nil {
			return llir.LLIR{}, opts.CompilationOptions, err
		} else {
			runname = generatedRunname
		}
	}

	internalS3Port := rand.Intn(65536) + 1
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using internal S3 port %d\n", internalS3Port)
	}

	yamlValues, dashdashSetValues, dashdashSetFileValues, queueSpec, err := linker.Configure(compilationName, runname, templatePath, internalS3Port, opts.ConfigureOptions)
	if err != nil {
		return llir.LLIR{}, opts.CompilationOptions, err
	}

	if !opts.Verbose {
		defer os.RemoveAll(templatePath)
	}

	// we need to instantiate the application's templates first...
	namespace := "" // intentionally not passing Target.Namespace to application templates
	if yaml, err := helm.Template(runname, namespace, templatePath, yamlValues, helm.TemplateOptions{OverrideValues: dashdashSetValues, OverrideFileValues: dashdashSetFileValues, Verbose: opts.Verbose}); err != nil {
		return llir.LLIR{}, opts.CompilationOptions, err
	} else if hlir, err := parser.Parse(yaml); err != nil {
		return llir.LLIR{}, opts.CompilationOptions, err
	} else if ir, err := transformer.Lower(compilationName, runname, hlir, queueSpec, opts.ConfigureOptions.CompilationOptions, opts.Verbose); err != nil {
		return llir.LLIR{}, opts.CompilationOptions, err
	} else {
		return ir, opts.CompilationOptions, nil
	}
}
