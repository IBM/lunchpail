package fe

import (
	"fmt"
	"os"

	"lunchpail.io/pkg/be/helm"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/parser"
	"lunchpail.io/pkg/fe/transformer"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

type PrepareOptions struct {
	NoDispatchers bool
}

// Return the low-level intermediate representation (LLIR) for a run
// of this application. If runname is "", one will be generated.
func PrepareForRun(runname string, popts PrepareOptions, opts build.Options) (llir.LLIR, error) {
	hlir, err := prepareHLIR(runname, popts, opts)
	if err != nil {
		return llir.LLIR{}, err
	}

	return PrepareHLIRForRun(hlir, runname, popts, opts)
}

func prepareHLIR(runname string, popts PrepareOptions, opts build.Options) (hlir.HLIR, error) {
	verbose := opts.Log.Verbose

	// Stage this application to a local directory
	templatePath, err := build.StageForRun(build.StageOptions{Verbose: verbose})
	if err != nil {
		return hlir.HLIR{}, err
	} else if opts.Log.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory for runname=%s is %s\n", runname, templatePath)
	}

	// Assign a runname if not given
	if runname == "" {
		if generatedRunname, err := linker.GenerateRunName(build.Name()); err != nil {
			return hlir.HLIR{}, err
		} else {
			runname = generatedRunname
		}
	}

	// Set up values that will be given to the application YAML
	yamlValues, err := linker.Configure(build.Name(), runname, opts)
	if err != nil {
		return hlir.HLIR{}, err
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
		return hlir.HLIR{}, err
	}

	// Now that we're instantiated any templates, we can parse the
	// application YAML. We parse into the high-level intermediate
	// representation (HLIR).
	ir, err := parser.Parse(yaml)
	if err != nil {
		return hlir.HLIR{}, err
	}

	return ir, nil
}

func PrepareHLIRForRun(ir hlir.HLIR, runname string, popts PrepareOptions, opts build.Options) (llir.LLIR, error) {
	// Assign a runname if not given
	if runname == "" {
		if generatedRunname, err := linker.GenerateRunName(build.Name()); err != nil {
			return llir.LLIR{}, err
		} else {
			runname = generatedRunname
		}
	}

	queueSpec, err := queue.ParseFlag(opts.Queue, runname)
	if err != nil {
		return llir.LLIR{}, err
	}

	if popts.NoDispatchers {
		if ir.HasDispatchers() {
			if opts.Log.Verbose {
				fmt.Fprintln(os.Stderr, "Removing application-provided dispatchers in favor of command line inputs")
			}
			ir = ir.RemoveDispatchers()
		}
	}

	// Finally we can transform the HLIR to the low-level
	// intermediate representation (LLIR).
	return transformer.Lower(build.Name(), runname, ir, queueSpec, opts)
}
