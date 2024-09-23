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

func PrepareForRun(runname string, opts compilation.Options) (llir.LLIR, error) {
	verbose := opts.Log.Verbose

	stageOpts := compilation.StageOptions{Verbose: verbose}
	compilationName, templatePath, _, err := compilation.Stage(stageOpts)
	if err != nil {
		return llir.LLIR{}, err
	} else if opts.Log.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory for runname=%s is %s\n", runname, templatePath)
	}

	if runname == "" {
		if generatedRunname, err := linker.GenerateRunName(compilationName); err != nil {
			return llir.LLIR{}, err
		} else {
			runname = generatedRunname
		}
	}

	internalS3Port := rand.Intn(65536) + 1
	if verbose {
		fmt.Fprintf(os.Stderr, "Using internal S3 port %d\n", internalS3Port)
	}

	yamlValues, queueSpec, err := linker.Configure(compilationName, runname, internalS3Port, opts)
	if err != nil {
		return llir.LLIR{}, err
	}

	if !verbose {
		defer os.RemoveAll(templatePath)
	} else {
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.OverrideValues)
		fmt.Fprintf(os.Stderr, "shrinkwrap app file overrides=%v\n", opts.OverrideFileValues)
	}

	// we need to instantiate the application's templates first...
	namespace := "" // intentionally not passing Target.Namespace to application templates
	if yaml, err := helm.Template(runname, namespace, templatePath, yamlValues, helm.TemplateOptions{OverrideValues: opts.OverrideValues, OverrideFileValues: opts.OverrideFileValues, Verbose: verbose}); err != nil {
		return llir.LLIR{}, err
	} else if hlir, err := parser.Parse(yaml); err != nil {
		return llir.LLIR{}, err
	} else if ir, err := transformer.Lower(compilationName, runname, hlir, queueSpec, opts); err != nil {
		return llir.LLIR{}, err
	} else {
		return ir, nil
	}
}
