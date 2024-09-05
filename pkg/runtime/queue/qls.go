package queue

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"lunchpail.io/pkg/be"
)

func Qls(ctx context.Context, backend be.Backend, runname, path string) error {
	c, stop, err := NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return err
	}

	prefix := filepath.Join(c.Paths.Prefix, path)
	for o := range c.ListObjects(c.Paths.Bucket, prefix, true) {
		fmt.Println(strings.Replace(o.Key, prefix+"/", "", 1))
	}

	stop()
	return nil
}
