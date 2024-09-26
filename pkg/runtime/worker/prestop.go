package worker

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/runtime/queue"
)

func PreStop(ctx context.Context, opts Options) error {
	client, err := queue.NewS3Client(ctx)
	if err != nil {
		return err
	}

	if opts.Debug {
		fmt.Println("Marking worker as done...")
	}

	client.Rm(client.Paths.Bucket, client.Paths.Alive)
	client.Touch(client.Paths.Bucket, client.Paths.Dead)

	if opts.Verbose {
		fmt.Printf("This worker is shutting down %s\n", os.Getenv("LUNCHPAIL_POD_NAME"))
	}

	return nil
}
