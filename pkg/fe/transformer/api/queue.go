package api

import (
	"path/filepath"

	"lunchpail.io/pkg/fe/linker/queue"
)

// Path in s3 to store the queue for the given run
func QueuePrefixPath(queueSpec queue.Spec, runname string) string {
	return filepath.Join(queueSpec.Bucket, "lunchpail", runname)
}

// Path in s3 to store the queue data for a particular worker in a
// particular pool for a particular run. Note how we need to defer the
// worker name until run time, which we do via a
// $LUNCHPAIL_WORKER_NAME env var.
func QueuePrefixPathForWorker(queueSpec queue.Spec, runname, poolName string) string {
	return filepath.Join(QueuePrefixPath(queueSpec, runname), "queues", poolName+".$LUNCHPAIL_WORKER_NAME")
}

// Inject queue secrets
func envForQueue(queueSpec queue.Spec) envFrom {
	return envFrom{
		Prefix:    "lunchpail_queue_",
		SecretRef: secretRef{queueSpec.Name},
	}
}
