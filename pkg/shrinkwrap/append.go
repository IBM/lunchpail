package shrinkwrap

import (
	"io"
	"os"
)

func appendFile(dstPath, srcPath string) error {
	dst, err := os.OpenFile(dstPath, os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}
	defer dst.Close()

	src, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer src.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return err
	}

	return nil
}
