package worker

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/runtime/queue"
)

func PreStop(ctx context.Context, opts Options) error {
	client, err := queue.NewS3Client(ctx)
	if err != nil {
		return err
	}

	if opts.LogOptions.Debug {
		fmt.Println("Marking worker as done...")
	}

	client.Rm(opts.PathArgs.Bucket, opts.PathArgs.TemplateP(api.WorkerAliveMarker))
	client.Touch(opts.PathArgs.Bucket, opts.PathArgs.TemplateP(api.WorkerDeadMarker))

	if opts.LogOptions.Verbose {
		fmt.Printf("This worker is shutting down %s\n", os.Getenv("LUNCHPAIL_POD_NAME"))
	}

	return nil
}
