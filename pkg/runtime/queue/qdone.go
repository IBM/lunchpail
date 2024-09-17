package queue

import "context"

// Indicate dispatching is done
func Qdone(ctx context.Context) error {
	c, err := NewS3Client(ctx)
	if err != nil {
		return err
	}

	return c.Touch(c.Paths.Bucket, c.Paths.Done)
}
