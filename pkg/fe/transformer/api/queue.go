package api

import (
	"fmt"
	"path/filepath"
	"strings"

	"lunchpail.io/pkg/fe/linker/queue"
)

// Path in s3 to store the queue for the given run
func QueuePrefixPath(queueSpec queue.Spec, runname string) string {
	return filepath.Join(queueSpec.Bucket, "lunchpail", runname)
}

// The queue path for a worker that specifies the pool name and the worker name
func QueueSubPathForWorker(poolName, workerName string) string {
	return filepath.Join(poolName, workerName)
}

// Opposite of `QueueSubPathForWorker`, e.g. test7f-pool1/w96bh -> (test7f-pool1,w96bh)
func ExtractNamesFromSubPathForWorker(combo string) (poolName string, workerName string, err error) {
	if idx := strings.Index(combo, "/"); idx < 0 {
		// TODO error handling here. what do we want to do?
		err = fmt.Errorf("Invalid subpath %s", combo)
	} else {
		poolName = combo[:idx]
		workerName = combo[idx+1:]
	}
	return
}

// Path in s3 to store the queue data for a particular worker in a
// particular pool for a particular run. Note how we need to defer the
// worker name until run time, which we do via a
// $LUNCHPAIL_WORKER_NAME env var.
func QueuePrefixPathForWorker(queueSpec queue.Spec, runname, poolName string) string {
	return filepath.Join(
		QueuePrefixPath(queueSpec, runname),
		"queues",
		QueueSubPathForWorker(poolName, "$LUNCHPAIL_WORKER_NAME"),
	)
}
