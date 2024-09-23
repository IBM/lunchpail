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

func PrepareForRun(runname string, opts compilation.Options) (llir.LLIR, compilation.Options, error) {
	stageOpts := compilation.StageOptions{}
	verbose := opts.Log.Verbose
	stageOpts.Verbose = verbose
	compilationName, templatePath, _, err := compilation.Stage(stageOpts)
	if err != nil {
		return llir.LLIR{}, opts, err
	}

	if runname == "" {
		if generatedRunname, err := linker.GenerateRunName(compilationName); err != nil {
			return llir.LLIR{}, opts, err
		} else {
			runname = generatedRunname
		}
	}

	internalS3Port := rand.Intn(65536) + 1
	if verbose {
		fmt.Fprintf(os.Stderr, "Using internal S3 port %d\n", internalS3Port)
	}

	yamlValues, dashdashSetValues, dashdashSetFileValues, queueSpec, err := linker.Configure(compilationName, runname, templatePath, internalS3Port, opts)
	if err != nil {
		return llir.LLIR{}, opts, err
	}

	if !verbose {
		defer os.RemoveAll(templatePath)
	}

	// we need to instantiate the application's templates first...
	namespace := "" // intentionally not passing Target.Namespace to application templates
	if yaml, err := helm.Template(runname, namespace, templatePath, yamlValues, helm.TemplateOptions{OverrideValues: dashdashSetValues, OverrideFileValues: dashdashSetFileValues, Verbose: verbose}); err != nil {
		return llir.LLIR{}, opts, err
	} else if hlir, err := parser.Parse(yaml); err != nil {
		return llir.LLIR{}, opts, err
	} else if ir, err := transformer.Lower(compilationName, runname, hlir, queueSpec, opts); err != nil {
		return llir.LLIR{}, opts, err
	} else {
		return ir, opts, nil
	}
}
