package queue

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"

	"lunchpail.io/pkg/be"
)

type CopyInSpec struct {
	SrcDir string
	Bucket string
}

func CopyIn(ctx context.Context, backend be.Backend, runname string, specs []CopyInSpec) error {
	s3, stop, err := NewS3ClientForRun(ctx, backend, runname)
	if err != nil {
		return err
	}
	defer stop()

	for _, spec := range specs {
		fmt.Fprintf(os.Stderr, "Preparing upload with mkdirp on s3 bucket=%s\n", spec.Bucket)
		if err := s3.Mkdirp(spec.Bucket); err != nil {
			return err
		}

		fmt.Fprintf(os.Stderr, "Uploading files from local directory=%s to s3 bucket=%s\n", spec.SrcDir, spec.Bucket)
		if err := filepath.WalkDir(spec.SrcDir, func(path string, dir fs.DirEntry, err error) error {
			if err != nil {
				return err
			} else if !dir.IsDir() {
				for i := range 10 {
					dst := strings.Replace(path, spec.SrcDir+"/", "", 1)
					fmt.Fprintf(os.Stderr, "Uploading %s to s3 %s\n", path, dst)
					if err := s3.Upload(spec.Bucket, path, dst); err == nil {
						break
					} else {
						fmt.Fprintf(os.Stderr, "Retrying upload iter=%d path=%s\n%v\n", i, path, err)
						time.Sleep(1 * time.Second)
					}
				}
			}
			return nil
		}); err != nil {
			return err
		}
	}

	return nil
}
