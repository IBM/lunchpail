package queue

import (
	"context"
	"path/filepath"
	"strings"

	"lunchpail.io/pkg/be"
)

func Ls(ctx context.Context, backend be.Backend, runname, path string) (chan string, error) {
	c, stop, err := NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return nil, err
	}

	files := make(chan string)
	prefix := filepath.Join(c.Paths.Prefix, path)

	go func() {
		defer stop()
		defer close(files)
		for o := range c.ListObjects(c.Paths.Bucket, prefix, true) {
			files <- strings.Replace(o.Key, prefix+"/", "", 1)
		}
	}()

	return files, nil
}
