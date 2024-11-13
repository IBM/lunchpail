package queue

import (
	"context"
	"regexp"
	"strings"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
)

func Ls(ctx context.Context, backend be.Backend, run queue.RunContext, path string, que queue.Spec, opts build.LogOptions) (<-chan string, <-chan error, error) {
	c, err := NewS3ClientForRun(ctx, backend, run, que, opts)
	if err != nil {
		return nil, nil, err
	}
	run.Bucket = c.RunContext.Bucket

	wildcard := run.ForPool("*").ForWorker("*").ForTask("*")

	var prefix string
	switch path {
	case "unassigned":
		prefix = wildcard.AsFile(queue.Unassigned)
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
	case "blobs":
		prefix = wildcard.AsFile(queue.Blobs)
	case "meta":
		prefix = wildcard.AsFile(queue.Meta)
	default:
		prefix = wildcard.ListenPrefixForAnyStep(true)
	}

	nonqueue := regexp.MustCompile("dead|succeeded|dispatcherdone|alive|killfile")

	files := make(chan string)
	errors := make(chan error)
	go func() {
		defer c.Stop()
		defer close(files)
		defer close(errors)
		for o := range c.ListObjects(c.RunContext.Bucket, prefix, true) {
			if o.Err != nil {
				errors <- o.Err
			} else {
				f := strings.Replace(o.Key, prefix+"/", "", 1)
				if f != "" && path != "" || !nonqueue.MatchString(f) {
					// this means: we want the default (path=="") behavior to match only queue-related objects
					files <- f
				}
			}
		}
	}()

	return files, errors, nil
}
