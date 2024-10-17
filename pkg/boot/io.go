package boot

import (
	"context"
	"path/filepath"
	"slices"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/runtime/builtins"
	"lunchpail.io/pkg/runtime/queue"
)

// Behave like `cat inputs | ... > outputs`
func catAndRedirect(ctx context.Context, inputs []string, backend be.Backend, ir llir.LLIR, opts build.LogOptions) error {
	client, err := queue.NewS3ClientForRun(ctx, backend, ir.RunName)
	if err != nil {
		return err
	}
	defer client.Stop()

	if err := builtins.Cat(ctx, client.S3Client, ir.RunName, inputs, opts); err != nil {
		return err
	}

	// TODO: backend.Wait(ir)? which would be a no-op for local

	// If we aren't piped into anything, then copy out the outbox files
	if true /*!util.StdoutIsTty()*/ {
		folderFor := func(output string) string {
			inIdx := slices.IndexFunc(inputs, func(in string) bool { return filepath.Base(in) == output })
			if inIdx >= 0 {
				return filepath.Dir(inputs[inIdx])
			}
			return "."
		}
		if err := builtins.RedirectTo(ctx, client.S3Client, ir.RunName, folderFor, opts); err != nil {
			return err
		}
	}

	return nil
}
