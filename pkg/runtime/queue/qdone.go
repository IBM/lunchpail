package queue

import (
	"context"
	"fmt"
	"os"
)

// Indicate dispatching is done, with given client
func QdoneClient(ctx context.Context, c S3Client) (err error) {
	fmt.Fprintf(os.Stderr, "Done with dispatching\n")
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
