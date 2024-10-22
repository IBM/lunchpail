package workstealer

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
	"lunchpail.io/pkg/util"
)

type Options struct {
	// If we need to resort to polling of S3, this is the polling interval we will use
	PollingInterval int

	// Automatically tear down the run when all output has been consumed?
	SelfDestruct bool

	build.LogOptions
}

type client struct {
	s3 s3.S3Client
	queue.RunContext
	pathPatterns
	build.LogOptions
}

func printenv() {
	for _, e := range os.Environ() {
		fmt.Fprintf(os.Stderr, "%v\n", e)
	}
}

func Run(ctx context.Context, run queue.RunContext, opts Options) error {
	s3, err := s3.NewS3Client(ctx)
	if err != nil {
		return err
	}
	c := client{s3, run, newPathPatterns(run), opts.LogOptions}

	fmt.Fprintln(os.Stderr, "Workstealer starting")
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Run: %v\n", run)
		fmt.Fprintf(os.Stderr, "PathPatterns: %v\n", c.pathPatterns.outboxTask.String())
		printenv()
	}

	done := false
	for !done {
		err = once(ctx, c, opts)
		if err == nil || isFatal(err) {
			done = true
		} else {
			// wait for s3 to be ready
			time.Sleep(1 * time.Second)
		}
	}

	// Drop a final breadcrumb indicating we are ready to tear
	// down all associated resources
	if opts.SelfDestruct {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Instructing the run to self-destruct bucket=%s file=%s\n", c.RunContext.Bucket, c.RunContext.AsFile(queue.AllDoneMarker))
		}
		if err := s3.Touch(c.RunContext.Bucket, c.RunContext.AsFile(queue.AllDoneMarker)); err != nil {
			fmt.Fprintf(os.Stderr, "Unable to touch AllDone file\n%v\n", err)
		}
	} else if opts.Verbose {
		fmt.Fprintln(os.Stderr, "*Not* instructing the run to self-destruct")
	}

	util.SleepBeforeExit()
	fmt.Fprintln(os.Stderr, "The job should be all done now")

	return err
}

func isFatal(err error) bool {
	return err != nil && strings.Contains(err.Error(), "connection refused") || strings.Contains(err.Error(), "unexpected EOF")
}

func once(ctx context.Context, c client, opts Options) error {
	if err := c.s3.Mkdirp(c.RunContext.Bucket); err != nil {
		return err
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Listen bucket=%s path=%s path2=%s\n", c.RunContext.Bucket, c.RunContext.ListenPrefix(), c.RunContext.AsFile(queue.AssignedAndFinished))
	}
	step0Objects, step0Errs := c.s3.Listen(c.RunContext.Bucket, c.RunContext.ListenPrefix(), "", true)
	step1Objects, step1Errs := c.s3.Listen(c.RunContext.Bucket, c.RunContext.AsFile(queue.AssignedAndFinished), "", true)
	defer c.s3.StopListening(c.RunContext.Bucket)

	done := false
	for !done {
		select {
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
		case <-ctx.Done():
			done = true
			continue
		}

		// fetch and parse model
		m := c.fetchModel()

		if err := m.report(c); err != nil {
			return err
		}

		// assess it
		done = c.assess(m)
	}

	return nil
}
