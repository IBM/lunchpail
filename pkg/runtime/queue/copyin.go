package queue

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func CopyIn(srcDir, bucket string) error {
	s3, err := NewS3Client()
	if err != nil {
		return err
	}

	fmt.Fprintf(os.Stderr, "Preparing upload with mkdirp on s3 bucket=%s\n", bucket)
	if err := s3.Mkdirp(bucket); err != nil {
		return err
	}

	fmt.Fprintf(os.Stderr, "Uploading files from local directory=%s to s3 bucket=%s\n", srcDir, bucket)
	if err := filepath.WalkDir(srcDir, func(path string, dir fs.DirEntry, err error) error {
		if err != nil {
			return err
		} else if !dir.IsDir() {
			for i := range 10 {
				dst := strings.Replace(path, srcDir+"/", "", 1)
				fmt.Fprintf(os.Stderr, "Uploading %s to s3 %s\n", path, dst)
				if err := s3.Upload(bucket, path, dst); err == nil {
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

	return nil
}
