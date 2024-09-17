package queue

import (
	"context"
	"fmt"
	"os"

	"path/filepath"
	"strings"
)

func CopyOut(ctx context.Context, remotePath, localPath string) error {
	c, err := NewS3Client(ctx)
	if err != nil {
		return err
	}

	A := strings.Split(remotePath, "/")
	bucket := A[0]
	remote := filepath.Join(A[1:]...)

	fmt.Fprintf(os.Stderr, "Downloading files from bucket=%s remotePath=%s (%s) localPath=%s\n", bucket, remote, remotePath, localPath)
	return c.DownloadFolder(bucket, remote, localPath)
}
