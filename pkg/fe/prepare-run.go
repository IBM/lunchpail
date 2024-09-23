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
	CompilationOptions compilation.Options
	DryRun             bool
	Watch              bool
	UseThisRunName     string
}

func PrepareForRun(opts CompileOptions) (llir.LLIR, compilation.Options, error) {
	stageOpts := compilation.StageOptions{}
	verbose := opts.CompilationOptions.Log.Verbose
	stageOpts.Verbose = verbose
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
	if verbose {
		fmt.Fprintf(os.Stderr, "Using internal S3 port %d\n", internalS3Port)
	}

	yamlValues, dashdashSetValues, dashdashSetFileValues, queueSpec, err := linker.Configure(compilationName, runname, templatePath, internalS3Port, opts.CompilationOptions)
	if err != nil {
		return llir.LLIR{}, opts.CompilationOptions, err
	}

	if !verbose {
		defer os.RemoveAll(templatePath)
	}

	// we need to instantiate the application's templates first...
	namespace := "" // intentionally not passing Target.Namespace to application templates
	if yaml, err := helm.Template(runname, namespace, templatePath, yamlValues, helm.TemplateOptions{OverrideValues: dashdashSetValues, OverrideFileValues: dashdashSetFileValues, Verbose: verbose}); err != nil {
		return llir.LLIR{}, opts.CompilationOptions, err
	} else if hlir, err := parser.Parse(yaml); err != nil {
		return llir.LLIR{}, opts.CompilationOptions, err
	} else if ir, err := transformer.Lower(compilationName, runname, hlir, queueSpec, opts.CompilationOptions); err != nil {
		return llir.LLIR{}, opts.CompilationOptions, err
	} else {
		return ir, opts.CompilationOptions, nil
	}
}
