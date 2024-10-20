package queue

import "os"

type filepaths struct {
	Bucket string
}

func pathsForRun() (filepaths, error) {
	return pathsFor(os.Getenv("LUNCHPAIL_QUEUE_BUCKET"))
}

func pathsFor(bucket string) (filepaths, error) {
	return filepaths{bucket}, nil
}
