package queue

import (
	"context"
	"fmt"
	"strings"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/ir/queue"
)

func Ls(ctx context.Context, backend be.Backend, run queue.RunContext, path string) (<-chan string, <-chan error, error) {
	c, err := NewS3ClientForRun(ctx, backend, run.RunName)
	if err != nil {
		return nil, nil, err
	}
	run.Bucket = c.Paths.Bucket // TODO

	wildcard := run.ForPool("*").ForWorker("*").ForTask("*")

	var prefix string
	switch path {
	case "exitcode":
		prefix = wildcard.AsFile(queue.FinishedWithCode)
	case "stdout":
		prefix = wildcard.AsFile(queue.FinishedWithStdout)
	case "stderr":
		prefix = wildcard.AsFile(queue.FinishedWithStderr)
	case "succeeded":
		prefix = wildcard.AsFile(queue.FinishedWithSucceeded)
	case "failed":
		prefix = wildcard.AsFile(queue.FinishedWithFailed)
	default:
		return nil, nil, fmt.Errorf("Unsupported path %s", path)
	}

	files := make(chan string)
	errors := make(chan error)
	go func() {
		defer c.Stop()
		defer close(files)
		defer close(errors)
		for o := range c.ListObjects(run.Bucket, prefix, true) {
			if o.Err != nil {
				errors <- o.Err
			} else {
				files <- strings.Replace(o.Key, prefix+"/", "", 1)
			}
		}
	}()

	return files, errors, nil
}
