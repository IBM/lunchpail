package workstealer

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"lunchpail.io/pkg/build"
	q "lunchpail.io/pkg/runtime/queue"
	"lunchpail.io/pkg/util"
)

// Specification of where we should find and store objects
type Spec struct {
	RunName          string
	Bucket           string
	ListenPrefix     string
	Unassigned       string
	Outbox           string
	Finished         string
	AllDone          string
	WorkerInbox      string
	WorkerProcessing string
	WorkerOutbox     string
	WorkerKillfile   string
}

type Options struct {
	PollingInterval int
	build.LogOptions
}

type client struct {
	s3 q.S3Client
	Spec
	build.LogOptions
}

func printenv() {
	for _, e := range os.Environ() {
		fmt.Fprintf(os.Stderr, "%v\n", e)
	}
}

func Run(ctx context.Context, spec Spec, opts Options) error {
	s3, err := q.NewS3Client(ctx)
	if err != nil {
		return err
	}
	c := client{s3, spec, opts.LogOptions}

	fmt.Fprintln(os.Stderr, "Workstealer starting")
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Spec: %v\n", spec)
		printenv()
	}

	done := false
	for !done {
		err = run(ctx, c, opts)
		if err == nil || !strings.Contains(err.Error(), "connection refused") {
			done = true
		} else {
			// wait for s3 to be ready
			time.Sleep(1 * time.Second)
		}
	}

	// Drop a final breadcrumb indicating we are ready to tear
	// down all associated resources
	if err := s3.Touch(c.Spec.Bucket, c.Spec.AllDone); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to touch AllDone file\n%v\n", err)
	}

	util.SleepBeforeExit()
	fmt.Fprintln(os.Stderr, "The job should be all done now")

	return err
}

func run(ctx context.Context, c client, opts Options) error {
	objs, errs := c.s3.Listen(c.Spec.Bucket, c.Spec.ListenPrefix, "", true)
	defer c.s3.StopListening(c.Spec.Bucket)

	done := false
	for !done {
		select {
		case err := <-errs:
			if err != nil && strings.Contains(err.Error(), "connection refused") {
				return err
			}

			fmt.Fprintf(os.Stderr, "Got push notification error: %v\n", err)

			// sleep for a bit
			time.Sleep(time.Duration(opts.PollingInterval) * time.Second)
		case obj := <-objs:
			// TODO update model incrementally rather than
			// re-fetching and re-parsing the entire model
			// every time there is a single change
			if strings.Contains(obj, "/logs/") {
				continue
			}

			if c.LogOptions.Debug {
				fmt.Fprintf(os.Stderr, "Got push notification object=%s\n", obj)
			}
		case <-ctx.Done():
			done = true
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
