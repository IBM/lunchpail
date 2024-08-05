package api

import (
	"path/filepath"

	"lunchpail.io/pkg/fe/linker/queue"
)

// path in s3 to store the queue for the given run
func QueuePrefixPath(queueSpec queue.Spec, runname string) string {
	return filepath.Join(queueSpec.Bucket, "lunchpail", runname)
}