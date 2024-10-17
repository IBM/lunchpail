package queue

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api"
)

// Indicate dispatching is done, with given client
func QdoneClient(ctx context.Context, c S3Client, runname string, opts build.LogOptions) (err error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Done with dispatching\n")
	}

	args := api.PathArgs{Bucket: c.Paths.Bucket, RunName: runname, Step: 0} // FIXME
	return c.Touch(args.Bucket, args.TemplateP(api.DispatcherDoneMarker))
}

// Indicate dispatching is done
func Qdone(ctx context.Context, runname string, opts build.LogOptions) error {
	c, err := NewS3Client(ctx) // pull config from env vars
	if err != nil {
		return err
	}

	return QdoneClient(ctx, c, runname, opts)
}
