package api

import (
	"path/filepath"

	"lunchpail.io/pkg/fe/linker/queue"
)

// Path in s3 to store the queue for the given run
func QueuePrefixPath(queueSpec queue.Spec, runname string) string {
	return filepath.Join(queueSpec.Bucket, "lunchpail", runname)
}

// Inject queue secrets
func envForQueue(queueSpec queue.Spec) envFrom {
	return envFrom{
		Prefix:    "lunchpail_queue_",
		SecretRef: secretRef{queueSpec.Name},
	}
}
