package queuestreamer

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
)

type client struct {
	s3 s3.S3Client
	queue.RunContext
	pathPatterns PathPatterns
	build.LogOptions
}

type StreamOptions struct {
	build.LogOptions

	// If we need to resort to polling of S3, this is the polling interval we will use
	PollingInterval int
}

func StreamModel(ctx context.Context, s3 s3.S3Client, run queue.RunContext, modelChan chan Model, doneChan chan struct{}, opts StreamOptions) error {
	c := client{s3, run, NewPathPatterns(run), opts.LogOptions}

	if err := c.s3.Mkdirp(c.RunContext.Bucket); err != nil {
		return err
	}

	for {
		err := once(ctx, c, modelChan, doneChan, opts)
		if err == nil || isFatal(err) {
			return err
		} else {
			// wait for s3 to be ready
			time.Sleep(1 * time.Second)
		}
	}
}

func isFatal(err error) bool {
	return err != nil && strings.Contains(err.Error(), "connection refused") || strings.Contains(err.Error(), "unexpected EOF")
}

func once(ctx context.Context, c client, modelChan chan Model, doneChan chan struct{}, opts StreamOptions) error {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Listen bucket=%s path=%s path2=%s\n", c.RunContext.Bucket, c.RunContext.ListenPrefix(), c.RunContext.AsFile(queue.AssignedAndFinished))
	}
	step0Objects, step0Errs := c.s3.Listen(c.RunContext.Bucket, c.RunContext.ListenPrefix(), "", true)
	step1Objects, step1Errs := c.s3.Listen(c.RunContext.Bucket, c.RunContext.AsFile(queue.AssignedAndFinished), "", true)
	defer c.s3.StopListening(c.RunContext.Bucket)

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-doneChan:
			if opts.Verbose {
				fmt.Fprintln(os.Stderr, "Queue model streamer got done notification")
			}
			return nil
		case err := <-step1Errs:
			if isFatal(err) {
				return err
			}
		case err := <-step0Errs:
			if isFatal(err) {
				return err
			}

			fmt.Fprintf(os.Stderr, "Got push notification error: %v\n", err)

			// sleep for a bit
			time.Sleep(time.Duration(opts.PollingInterval) * time.Second)

		case obj := <-step0Objects:
			if c.LogOptions.Verbose {
				fmt.Fprintf(os.Stderr, "Got push notification object=%s\n", obj)
			}
		case obj := <-step1Objects:
			if c.LogOptions.Verbose {
				fmt.Fprintf(os.Stderr, "Got push notification object=%s\n", obj)
			}
		}

		// fetch and parse model
		modelChan <- c.fetchModel()
	}
}
