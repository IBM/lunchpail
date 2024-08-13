package queue

import "path/filepath"

func Qcat(path string) error {
	c, err := NewS3Client()
	if err != nil {
		return err
	}

	prefix := filepath.Join(c.Paths.Prefix, path)
	if err := c.Cat(c.Paths.Bucket, prefix); err != nil {
		return err
	}

	return nil
}
