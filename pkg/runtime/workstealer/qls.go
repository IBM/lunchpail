package workstealer

import (
	"fmt"
	"path/filepath"
	"strings"
)

func Qls(path string) error {
	s3, err := newS3Client()
	if err != nil {
		return err
	}
	c := client{s3, pathsForRun()}

	prefix := filepath.Join(c.paths.prefix, path)
	for o := range c.s3.ListObjects(c.paths.bucket, prefix, true) {
		fmt.Println(strings.Replace(o.Key, prefix+"/", "", 1))
	}

	return nil
}
