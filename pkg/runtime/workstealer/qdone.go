package workstealer

// Indicate dispatching is done
func Qdone() error {
	s3, err := newS3Client()
	if err != nil {
		return err
	}
	c := client{s3, pathsForRun()}

	return c.s3.touch(c.paths.bucket, c.paths.done)
}
