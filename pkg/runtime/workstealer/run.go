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

func Run(ctx context.Context, spec Spec, opts build.LogOptions) error {
	s3, err := q.NewS3Client(ctx)
	if err != nil {
		return err
	}
	c := client{s3, spec, opts}

	s, err := util.SleepyTime("QUEUE_POLL_INTERVAL_SECONDS", 3)
	if err != nil {
		return err
	}

	fmt.Fprintln(os.Stderr, "Workstealer starting")
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Spec: %v\n", spec)
		printenv()
	}

	defer s3.StopListening(spec.Bucket)
	o, errs := s3.Listen(spec.Bucket, spec.ListenPrefix, "", true)
	for {
		select {
		case err := <-errs:
			fmt.Fprintln(os.Stderr, err)

			// sleep for a bit
			time.Sleep(s)
		case obj := <-o:
			// TODO update model incrementally rather than
			// re-fetching and re-parsing the entire model
			// every time there is a single change
			if strings.Contains(obj, "/logs/") {
				continue
			}
		}

		// fetch and parse model
		m := c.fetchModel()

		if err := m.report(c); err != nil {
			return err
		}

		// assess it
		if c.assess(m) {
			// all done
			break
		}
	}

	// Drop a final breadcrumb indicating we are ready to tear
	// down all associated resources
	if err := s3.Touch(spec.Bucket, spec.AllDone); err != nil {
		fmt.Fprintf(os.Stderr, "Unable to touch AllDone file\n%v\n", err)
	}

	util.SleepBeforeExit()
	fmt.Fprintln(os.Stderr, "The job should be all done now")
	return nil
}
