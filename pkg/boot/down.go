//go:build full || manage

package boot

import (
	"context"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker"
)

type DownOptions struct {
	Namespace            string
	Verbose              bool
	DeleteNamespace      bool
	DeleteAll            bool
	ApiKey               string
	DeleteCloudResources bool
}

func DownList(ctx context.Context, runnames []string, backend be.Backend, opts DownOptions) error {
	deleteNs := opts.DeleteNamespace

	if len(runnames) == 0 {
		if opts.DeleteAll {
			remainingRuns, err := backend.ListRuns(ctx, true)
			if err != nil {
				return err
			}
			for _, run := range remainingRuns {
				runnames = append(runnames, run.Name)
			}

			// so that the Down() call won't delete the
			// namespace. we'll do that after deleting all
			// runs
			opts.DeleteNamespace = false
		} else {
			// then the user didn't specify a run. pass "" which
			// will activate the logic that looks for a singleton
			// run in the given namespace
			return Down(ctx, "", backend, opts)
		}
	}

	// otherwise, Down all of the runs in the given list
	group, dctx := errgroup.WithContext(ctx)
	for _, runname := range runnames {
		group.Go(func() error { return Down(dctx, runname, backend, opts) })
	}
	if err := group.Wait(); err != nil {
		return err
	}

	if deleteNs {
		if err := backend.Purge(ctx); err != nil {
			return err
		}
	}

	return nil
}

func toCompilationOpts(opts DownOptions) compilation.Options {
	compilationOptions := compilation.Options{}
	compilationOptions.Target = &compilation.TargetOptions{Namespace: opts.Namespace}
	compilationOptions.ApiKey = opts.ApiKey

	return compilationOptions
}

func toUpOpts(runname string, opts DownOptions) UpOptions {
	configureOptions := linker.ConfigureOptions{}
	configureOptions.CompilationOptions = toCompilationOpts(opts)
	if configureOptions.CompilationOptions.Log == nil {
		configureOptions.CompilationOptions.Log = &compilation.LogOptions{}
	}
	configureOptions.CompilationOptions.Log.Verbose = opts.Verbose

	upOptions := UpOptions{}
	upOptions.ConfigureOptions = configureOptions
	upOptions.UseThisRunName = runname

	return upOptions
}

func Down(ctx context.Context, runname string, backend be.Backend, opts DownOptions) error {
	if runname == "" {
		singletonRun, err := util.Singleton(ctx, backend)
		if err != nil {
			return err
		}
		runname = singletonRun.Name
	}

	upOptions := toUpOpts(runname, opts)
	if err := upDown(ctx, backend, upOptions, false); err != nil {
		return err
	}

	if opts.DeleteNamespace {
		if err := backend.Purge(ctx); err != nil {
			return err
		}
	}

	return nil
}
