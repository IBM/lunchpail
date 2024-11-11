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
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/runtime/queue/upload"
)

func UploadFiles(ctx context.Context, backend be.Backend, run queue.RunContext, specs []upload.Upload, opts build.LogOptions) error {
	s3, err := NewS3ClientForRun(ctx, backend, run.RunName, opts)
	if err != nil {
		return err
	}
	defer s3.Stop()
	run.Bucket = s3.RunContext.Bucket // TODO

	for _, spec := range specs {
		bucket := spec.Bucket
		if bucket == "" {
			bucket = run.Bucket
		}

		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Preparing upload with mkdirp on s3 bucket=%s\n", bucket)
		}
		if err := s3.Mkdirp(bucket); err != nil {
			return err
		}

		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Uploading files from local path=%s to s3 bucket=%s targetDir='%s'\n", spec.LocalPath, bucket, spec.TargetDir)
		}
		info, err := os.Stat(spec.LocalPath)
		if err != nil {
			return err
		}

		switch mode := info.Mode(); {
		case mode.IsDir():
			if err := s3.copyInDir(bucket, spec, opts); err != nil {
				return err
			}
		case mode.IsRegular():
			if err := s3.copyInFile(bucket, spec.LocalPath, spec, opts); err != nil {
				return err
			}
		default:
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Skipping upload of filepath %s\n", spec.LocalPath)
			}
		}
	}

	return nil
}

func (s3 S3Client) copyInDir(bucket string, spec upload.Upload, opts build.LogOptions) error {
	return filepath.WalkDir(spec.LocalPath, func(path string, dir fs.DirEntry, err error) error {
		if err != nil {
			return err
		} else if !dir.IsDir() {
			return s3.copyInFile(bucket, path, spec, opts)
		}
		return nil
	})
}

func (s3 S3Client) copyInFile(bucket, localPath string, spec upload.Upload, opts build.LogOptions) error {
	for i := range 10 {
		select {
		case <-s3.context.Done():
			return nil
		default:
		}

		var dst string
		switch spec.TargetDir {
		case "":
			dst = strings.Replace(localPath, spec.LocalPath+"/", "", 1)
		default:
			dst = filepath.Join(spec.TargetDir, filepath.Base(localPath))
		}

		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Uploading %s to s3 %s\n", localPath, dst)
		}
		if err := s3.Upload(bucket, localPath, dst); err == nil {
			break
		} else {
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Retrying upload iter=%d path=%s\n%v\n", i, localPath, err)
			}
			time.Sleep(1 * time.Second)
		}
	}

	return nil
}
