package queue

import (
	"context"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/runtime/queue/upload"
)

func UploadFiles(ctx context.Context, backend be.Backend, runname string, specs []upload.Upload) error {
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

		fmt.Fprintf(os.Stderr, "Uploading files from local path=%s to s3 bucket=%s\n", spec.Path, spec.Bucket)
		info, err := os.Stat(spec.Path)
		if err != nil {
			return err
		}

		switch mode := info.Mode(); {
		case mode.IsDir():
			if err := s3.copyInDir(spec); err != nil {
				return err
			}
		case mode.IsRegular():
			if err := s3.copyInFile(spec.Path, spec); err != nil {
				return err
			}
		default:
			log.Printf("Skipping upload of filepath %s\n", spec.Path)
		}
	}

	return nil
}

func (s3 S3Client) copyInDir(spec upload.Upload) error {
	return filepath.WalkDir(spec.Path, func(path string, dir fs.DirEntry, err error) error {
		if err != nil {
			return err
		} else if !dir.IsDir() {
			return s3.copyInFile(path, spec)
		}
		return nil
	})
}

func (s3 S3Client) copyInFile(path string, spec upload.Upload) error {
	for i := range 10 {
		dst := strings.Replace(path, spec.Path+"/", "", 1)
		fmt.Fprintf(os.Stderr, "Uploading %s to s3 %s\n", path, dst)
		if err := s3.Upload(spec.Bucket, path, dst); err == nil {
			break
		} else {
			fmt.Fprintf(os.Stderr, "Retrying upload iter=%d path=%s\n%v\n", i, path, err)
			time.Sleep(1 * time.Second)
		}
	}

	return nil
}
