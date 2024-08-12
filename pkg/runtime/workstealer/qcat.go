package workstealer

import (
	"path/filepath"
)

func Qcat(path string) error {
	s3, err := newS3Client()
	if err != nil {
		return err
	}
	c := client{s3, pathsForRun()}

	prefix := filepath.Join(c.paths.prefix, path)
	if err := c.s3.Cat(c.paths.bucket, prefix); err != nil {
		return err
	}

	return nil
}
