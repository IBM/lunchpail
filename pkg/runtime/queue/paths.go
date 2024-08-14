package queue

import (
	"os"
	"path/filepath"
	"strings"
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

	// Ready to tear everything done
	AllDone string

	// Worker is alive
	Alive string

	// Worker is dead
	Dead string

	//
	Local string
}

func pathsForRun() filepaths {
	fullPrefix := strings.Split(os.Getenv("LUNCHPAIL_QUEUE_PATH"), "/")
	bucket := fullPrefix[0]
	poolPrefix := filepath.Join(fullPrefix[1:]...)
	prefix := strings.Replace(filepath.Join(fullPrefix[1:]...), "$LUNCHPAIL_WORKER_NAME", os.Getenv("LUNCHPAIL_POD_NAME"), 1)
	inbox := "inbox"
	processing := "processing"
	outbox := "outbox"
	done := filepath.Join(poolPrefix, "done")
	alldone := filepath.Join(poolPrefix, "alldone")
	alive := filepath.Join(prefix, inbox, ".alive")
	dead := filepath.Join(prefix, inbox, ".dead")
	local := os.Getenv("LUNCHPAIL_LOCAL_QUEUE_ROOT")

	return filepaths{bucket, poolPrefix, prefix, inbox, processing, outbox, done, alldone, alive, dead, local}
}
