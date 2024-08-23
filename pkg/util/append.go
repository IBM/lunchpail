package util

import (
	"io"
	"os"
)

func AppendFile(dstPath, srcPath string) error {
	dst, err := os.OpenFile(dstPath, os.O_WRONLY|os.O_APPEND|os.O_CREATE, 0644)
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

func AppendToFile(dstPath string, content []byte) error {
	dst, err := os.OpenFile(dstPath, os.O_WRONLY|os.O_APPEND|os.O_CREATE, 0644)
	if err != nil {
		return err
	}
	defer dst.Close()

	if _, err := dst.Write(content); err != nil {
		return err
	}

	return nil
}
