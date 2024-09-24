package queue

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe"
)

// Indicate dispatching is done, with given client
func QdoneClient(ctx context.Context, c S3Client) (err error) {
	fmt.Fprintf(os.Stderr, "%sDone with dispatching\n", observe.LogsComponentPrefix(lunchpail.DispatcherComponent))
	return c.Touch(c.Paths.Bucket, c.Paths.Done)
}

// Indicate dispatching is done
func Qdone(ctx context.Context) error {
	c, err := NewS3Client(ctx) // pull config from env vars
	if err != nil {
		return err
	}

	return QdoneClient(ctx, c)
}
