//go:build full || manage

package boot

import (
	"context"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
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
			remainingRuns, err := backend.ListRuns(ctx, true) // true: include Done runs
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

func toBuildOpts(opts DownOptions) build.Options {
	buildOptions := build.Options{}
	buildOptions.Target = &build.TargetOptions{Namespace: opts.Namespace}
	buildOptions.ApiKey = opts.ApiKey

	if buildOptions.Log == nil {
		buildOptions.Log = &build.LogOptions{}
	}
	buildOptions.Log.Verbose = opts.Verbose

	return buildOptions
}

func Down(ctx context.Context, runname string, backend be.Backend, opts DownOptions) error {
	if runname == "" {
		singletonRun, err := util.SingletonP(ctx, backend, true) // true: include Done runs
		if err != nil {
			return err
		}
		runname = singletonRun.Name
	}

	context := llir.Context{Run: queue.RunContext{RunName: runname}}

	copts := toBuildOpts(opts)
	ir, err := fe.PrepareForRun(context, fe.PrepareOptions{}, copts)
	if err != nil {
		return err
	}

	if err := backend.Down(ctx, ir, copts); err != nil {
		return err
	}

	if opts.DeleteNamespace {
		if err := backend.Purge(ctx); err != nil {
			return err
		}
	}

	return nil
}
