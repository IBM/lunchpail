package queue

import (
	"fmt"
	"path/filepath"
	"strings"
)

func Qls(path string) error {
	c, err := NewS3Client()
	if err != nil {
		return err
	}

	prefix := filepath.Join(c.Paths.Prefix, path)
	for o := range c.ListObjects(c.Paths.Bucket, prefix, true) {
		fmt.Println(strings.Replace(o.Key, prefix+"/", "", 1))
	}

	return nil
}
