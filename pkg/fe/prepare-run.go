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

type PrepareOptions struct {
	NoDispatchers bool
}

// Return the low-level intermediate representation (LLIR) for a run
// of this application. If runname is "", one will be generated.
func PrepareForRun(runname string, popts PrepareOptions, opts compilation.Options) (llir.LLIR, error) {
	verbose := opts.Log.Verbose

	// Stage this application to a local directory
	stageOpts := compilation.StageOptions{Verbose: verbose}
	compilationName, templatePath, _, err := compilation.Stage(stageOpts)
	if err != nil {
		return llir.LLIR{}, err
	} else if opts.Log.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory for runname=%s is %s\n", runname, templatePath)
	}

	// Assign a runname if not given
	if runname == "" {
		if generatedRunname, err := linker.GenerateRunName(compilationName); err != nil {
			return llir.LLIR{}, err
		} else {
			runname = generatedRunname
		}
	}

	// Assign a port for the internal S3 (TODO: we only need to do
	// this if this run will be using an internal S3)
	internalS3Port := rand.Intn(65536) + 1
	if verbose {
		fmt.Fprintf(os.Stderr, "Using internal S3 port %d\n", internalS3Port)
	}

	// Set up values that will be given to the application YAML
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

	// Instantiate the application's templates. We allow application YAML to have go/helm templates.
	yaml, err := helm.Template(runname, "", templatePath, yamlValues, helm.TemplateOptions{OverrideValues: opts.OverrideValues, OverrideFileValues: opts.OverrideFileValues, Verbose: verbose})
	if err != nil {
		return llir.LLIR{}, err
	}

	// Now that we're instantiated any templates, we can parse the
	// application YAML. We parse into the high-level intermediate
	// representation (HLIR).
	hlir, err := parser.Parse(yaml)
	if err != nil {
		return llir.LLIR{}, err
	}

	if popts.NoDispatchers {
		if verbose {
			fmt.Fprintln(os.Stderr, "Removing application-provided dispatchers in favor of command line inputs")
		}
		hlir = hlir.RemoveDispatchers()
	}

	// Finally we can transform the HLIR to the low-level
	// intermediate representation (LLIR).
	return transformer.Lower(compilationName, runname, hlir, queueSpec, opts)
}
