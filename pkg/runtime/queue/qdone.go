package queue

// Indicate dispatching is done
func Qdone() error {
	c, err := NewS3Client()
	if err != nil {
		return err
	}

	return c.Touch(c.Paths.Bucket, c.Paths.Done)
}
