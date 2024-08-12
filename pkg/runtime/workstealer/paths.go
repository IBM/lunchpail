package workstealer

// TODO once we incorporate the workstealer into the top-level pkg, we
// can share this with the runtime/worker/paths.go

import (
	"os"
	"path/filepath"
	"strings"
)

type filepaths struct {
	bucket     string
	poolPrefix string
	prefix     string
	inbox      string
	processing string
	outbox     string
	done       string
	alive      string
	dead       string
	local      string
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
	alive := filepath.Join(prefix, inbox, ".alive")
	dead := filepath.Join(prefix, inbox, ".dead")
	local := filepath.Join(os.Getenv("LUNCHPAIL_LOCAL_QUEUE_ROOT"), bucket)

	return filepaths{bucket, poolPrefix, prefix, inbox, processing, outbox, done, alive, dead, local}
}
