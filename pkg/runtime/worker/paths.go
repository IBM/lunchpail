package worker

import (
	"os"
	"path/filepath"
	"strings"
)

type filepaths struct {
	bucket     string
	prefix     string
	inbox      string
	processing string
	outbox     string
	alive      string
	dead       string
	local      string
}

func pathsForRun() filepaths {
	fullPrefix := strings.Split(os.Getenv("LUNCHPAIL_QUEUE_PATH"), "/")
	bucket := fullPrefix[0]
	prefix := strings.Replace(filepath.Join(fullPrefix[1:]...), "$LUNCHPAIL_WORKER_NAME", os.Getenv("LUNCHPAIL_POD_NAME"), 1)
	inbox := "inbox"
	processing := "processing"
	outbox := "outbox"
	alive := filepath.Join(prefix, inbox, ".alive")
	dead := filepath.Join(prefix, inbox, ".dead")
	local := os.Getenv("LUNCHPAIL_LOCAL_QUEUE_ROOT")

	return filepaths{bucket, prefix, inbox, processing, outbox, alive, dead, local}
}
