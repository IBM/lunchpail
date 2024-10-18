package queue

import (
	"os"
	"strings"
)

const (
	inboxFolder  = "inbox"
	outboxFolder = "outbox"
)

type filepaths struct {
	Bucket string
}

func pathsForRun() (filepaths, error) {
	return pathsFor(os.Getenv("LUNCHPAIL_QUEUE_PATH"))
}

func pathsFor(queuePrefixPath string) (filepaths, error) {
	fullPrefix := strings.Split(queuePrefixPath, "/")
	bucket := fullPrefix[0]

	return filepaths{bucket}, nil
}
