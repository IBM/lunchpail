package queuestreamer

import (
	"context"
	"errors"
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

	// Listen for changes to any step
	AnyStep bool
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
	return err != nil && (strings.Contains(err.Error(), "connection refused") || strings.Contains(err.Error(), "unexpected EOF"))
}

func once(ctx context.Context, c client, modelChan chan Model, doneChan chan struct{}, opts StreamOptions) error {
	prefix := c.RunContext.ListenPrefixForAnyStep(opts.AnyStep)
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Listen bucket=%s path=%s\n", c.RunContext.Bucket, prefix)
	}

	// We'll keep an eye out for this marker. If we see it, the run is done.
	allDoneMarker := c.RunContext.AsFile(queue.AllDoneMarker)

	objects, errs := c.s3.Listen(c.RunContext.Bucket, prefix, "", true)
	defer c.s3.StopListening(c.RunContext.Bucket)

	for {
		select {
		case <-ctx.Done():
			if opts.Verbose {
				fmt.Fprintln(os.Stderr, "Queue streamer terminating due to completed context")
			}
			return nil
		case <-doneChan:
			if opts.Verbose {
				fmt.Fprintln(os.Stderr, "Queue streamer got done notification")
			}
			return nil
		case err := <-errs:
			if isFatal(err) {
				return err
			}

			if err != nil && !errors.Is(err, s3.ListenNotSupportedError) {
				fmt.Fprintf(os.Stderr, "Queue streamer got push notification error: %v\n", err)

				// sleep for a bit
				time.Sleep(time.Duration(opts.PollingInterval) * time.Second)
			}

		case obj := <-objects:
			if c.LogOptions.Verbose {
				fmt.Fprintf(os.Stderr, "Queue streamer got push notification object=%s\n", obj)
			}

			if obj == allDoneMarker {
				if c.LogOptions.Verbose {
					fmt.Fprintln(os.Stderr, "Queue streamer got all done")
				}
				return nil
			}

			// fetch and parse model
			modelChan <- c.fetchModel(opts.AnyStep)
		}
	}
}
