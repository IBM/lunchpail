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

	// Where we will stash any locally downloaded tasks
	Local string
}

func pathsForRun() (filepaths, error) {
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

	tmpdir, err := os.MkdirTemp("", "lunchpail_local_queue_")
	if err != nil {
		return filepaths{}, err
	}
	local := tmpdir

	return filepaths{bucket, poolPrefix, prefix, inbox, processing, outbox, done, alldone, alive, dead, local}, nil
}
