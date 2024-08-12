package workstealer

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func CopyIn(srcDir, bucket string) error {
	s3, err := newS3Client()
	if err != nil {
		return err
	}

	fmt.Printf("Uploading files from dir=%s to bucket=%s\n", srcDir, bucket)
	if err := s3.Mkdirp(bucket); err != nil {
		return err
	}

	if err := filepath.WalkDir(srcDir, func(path string, dir fs.DirEntry, err error) error {
		if err != nil {
			return err
		} else if !dir.IsDir() {
			for i := range 10 {
				if err := s3.upload(bucket, path, strings.Replace(path, srcDir+"/", "", 1)); err == nil {
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
