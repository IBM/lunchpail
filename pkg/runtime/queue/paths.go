package queue

import (
	"os"
	"path/filepath"
	"strings"
)

const (
	inboxFolder  = "inbox"
	outboxFolder = "outbox"
)

type filepaths struct {
	Bucket     string
	PoolPrefix string
	Prefix     string
	Inbox      string
	Processing string
	Outbox     string

	// Dispatcher is done
	Done string

	// Worker is alive
	Alive string

	// Worker is dead
	Dead string
}

func pathsForRun() (filepaths, error) {
	return pathsFor(os.Getenv("LUNCHPAIL_QUEUE_PATH"))
}

func pathsFor(queuePrefixPath string) (filepaths, error) {
	fullPrefix := strings.Split(queuePrefixPath, "/")
	bucket := fullPrefix[0]
	poolPrefix := filepath.Join(fullPrefix[1:]...)
	prefix := strings.Replace(filepath.Join(fullPrefix[1:]...), "$LUNCHPAIL_WORKER_NAME", os.Getenv("LUNCHPAIL_POD_NAME"), 1)
	inbox := inboxFolder
	processing := "processing"
	outbox := outboxFolder
	done := filepath.Join(poolPrefix, "done")
	alive := filepath.Join(prefix, inbox, ".alive")
	dead := filepath.Join(prefix, inbox, ".dead")

	return filepaths{bucket, poolPrefix, prefix, inbox, processing, outbox, done, alive, dead}, nil
}

func (c S3Client) Outbox() string {
	return filepath.Join(c.Paths.PoolPrefix, c.Paths.Outbox)
}

func (c S3Client) finishedMarkers() string {
	return filepath.Join(c.Paths.PoolPrefix, "finished")
}

func (c S3Client) ConsumedMarker(task string) string {
	return filepath.Join(c.Paths.PoolPrefix, "consumed", filepath.Base(task))
}
