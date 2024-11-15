package fe

import (
	"fmt"
	"os"

	"lunchpail.io/pkg/be/helm"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/linker"
	q "lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/parser"
	"lunchpail.io/pkg/fe/transformer"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
)

type PrepareOptions struct {
	NoDispatchers bool
}

// Return the low-level intermediate representation (LLIR) for a run
// of this application. If runname is "", one will be generated.
func PrepareForRun(ctx llir.Context, popts PrepareOptions, opts build.Options) (llir.LLIR, error) {
	hlir, runOut, err := prepareHLIR(ctx.Run, popts, opts)
	if err != nil {
		return llir.LLIR{}, err
	}

	ctx.Run = runOut
	return PrepareHLIRForRun(hlir, ctx, popts, opts)
}

func prepareHLIR(run queue.RunContext, popts PrepareOptions, opts build.Options) (hlir.HLIR, queue.RunContext, error) {
	verbose := opts.Log.Verbose

	// Stage this application to a local directory
	templatePath, err := build.StageForRun(build.StageOptions{Verbose: verbose})
	if err != nil {
		return hlir.HLIR{}, run, err
	} else if opts.Log.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory for runname=%s is %s\n", run.RunName, templatePath)
	}

	// Assign a run.RunName if not given
	if run.RunName == "" {
		if generatedRunname, err := linker.GenerateRunName(build.Name()); err != nil {
			return hlir.HLIR{}, run, err
		} else {
			run.RunName = generatedRunname
		}
	}

	// Set up values that will be given to the application YAML
	yamlValues, err := linker.Configure(build.Name(), run.RunName, opts)
	if err != nil {
		return hlir.HLIR{}, run, err
	}

	if !verbose {
		defer os.RemoveAll(templatePath)
	} else {
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.OverrideValues)
		fmt.Fprintf(os.Stderr, "shrinkwrap app file overrides=%v\n", opts.OverrideFileValues)
	}

	// Instantiate the application's templates. We allow application YAML to have go/helm templates.
	yaml, err := helm.Template(run.RunName, "", templatePath, yamlValues, helm.TemplateOptions{OverrideValues: opts.OverrideValues, OverrideFileValues: opts.OverrideFileValues, Verbose: verbose})
	if err != nil {
		return hlir.HLIR{}, run, err
	}

	// Now that we're instantiated any templates, we can parse the
	// application YAML. We parse into the high-level intermediate
	// representation (HLIR).
	ir, err := parser.Parse(yaml)
	if err != nil {
		return hlir.HLIR{}, run, err
	}

	return ir, run, nil
}

func PrepareHLIRForRun(ir hlir.HLIR, ctx llir.Context, popts PrepareOptions, opts build.Options) (llir.LLIR, error) {
	// Assign a runname if not given
	if ctx.Run.RunName == "" {
		if generatedRunname, err := linker.GenerateRunName(build.Name()); err != nil {
			return llir.LLIR{}, err
		} else {
			r := ctx.Run
			r.RunName = generatedRunname
			ctx.Run = r
		}
	}

	if opts.Queue != "" || ctx.Queue.Endpoint == "" {
		spec, err := q.ParseFlag(opts.Queue, ctx.Run.RunName)
		if err != nil {
			return llir.LLIR{}, err
		}
		ctx.Queue = spec

		r := ctx.Run
		r.Bucket = ctx.Queue.Bucket
		ctx.Run = r
	}

	if popts.NoDispatchers {
		ir = ir.RemoveDispatchers()
	}

	// Finally we can transform the HLIR to the low-level
	// intermediate representation (LLIR).
	return transformer.Lower(build.Name(), ir, ctx, opts)
}
