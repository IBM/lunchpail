package boot

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"slices"

	"github.com/dustin/go-humanize/english"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/runtime/builtins"
	s3 "lunchpail.io/pkg/runtime/queue"
)

// Behave like `cat inputs | ... > outputs`
func catAndRedirect(ctx context.Context, inputs []string, backend be.Backend, ir llir.LLIR, opts build.LogOptions) error {
	client, err := s3.NewS3ClientForRun(ctx, backend, ir.Context.Run.RunName)
	if err != nil {
		return err
	}
	ir.Context.Run.Bucket = client.RunContext.Bucket
	defer client.Stop()

	// either we are the first step with command line inputs (if
	// so, "cat" them into the queue), or we are a subsequent step
	// (in which case we need to simulate a "dispatch done")
	if len(inputs) > 0 {
		// "cat" the inputs into the queue
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Using 'cat' to inject %s\n", english.Plural(len(inputs), "input file", ""))
		}
		if err := builtins.Cat(ctx, client.S3Client, ir.Context.Run, inputs, opts); err != nil {
			return err
		}
	} else if ir.Context.Run.Step > 0 {
		// simulate a "dispatch done"
		if opts.Verbose {
			fmt.Fprintln(os.Stderr, "up is simulating a dispatcher done event", os.Args)
		}
		if err := s3.QdoneClient(ctx, client.S3Client, ir.Context.Run, opts); err != nil {
			return err
		}
	}

	// TODO: backend.Wait(ir)? which would be a no-op for local

	// If we aren't piped into anything, then copy out the outbox files
	if ir.Context.Run.IsFinalStep {
		// We try to place the output files in the same
		// directory as the respective input files. TODO: this
		// may be a fool's errand, e.g. what if a single input
		// results in two outputs?
		folderFor := func(output string) string {
			inIdx := slices.IndexFunc(inputs, func(in string) bool { return filepath.Base(in) == output })
			if inIdx >= 0 {
				return filepath.Dir(inputs[inIdx])
			}
			return "."
		}
		if opts.Verbose {
			fmt.Fprintln(os.Stderr, "up is redirecting output files", os.Args)
		}
		if err := builtins.RedirectTo(ctx, client.S3Client, ir.Context.Run, folderFor, opts); err != nil {
			return err
		}
	}

	return nil
}

// For Step > 0, we will need to simulate that a dispatch is done
func fakeDispatch(ctx context.Context, backend be.Backend, run queue.RunContext, opts build.LogOptions) error {
	client, err := s3.NewS3ClientForRun(ctx, backend, run.RunName)
	if err != nil {
		return err
	}
	run.Bucket = client.RunContext.Bucket
	defer client.Stop()

	return s3.QdoneClient(ctx, client.S3Client, run, opts)
}
