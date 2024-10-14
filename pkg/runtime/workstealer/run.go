package workstealer

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	q "lunchpail.io/pkg/runtime/queue"
	"lunchpail.io/pkg/util"
)

var debug = os.Getenv("DEBUG") != ""
var run = os.Getenv("LUNCHPAIL_RUN_NAME")
var queue = os.Getenv("LUNCHPAIL_QUEUE_PATH")
var logDir = filepath.Join(queue, "logs")
var inbox = filepath.Join(queue, "inbox")
var finished = filepath.Join(queue, "finished")
var outbox = filepath.Join(queue, "outbox")
var queues = filepath.Join(queue, "queues")

type client struct {
	s3 q.S3Client
}

func printenv() {
	for _, e := range os.Environ() {
		fmt.Fprintf(os.Stderr, "%v\n", e)
	}
}

func Run(ctx context.Context) error {
	s3, err := q.NewS3Client(ctx)
	if err != nil {
		return err
	}
	c := client{s3}

	s, err := util.SleepyTime("QUEUE_POLL_INTERVAL_SECONDS", 3)
	if err != nil {
		return err
	}

	fmt.Printf("INFO Workstealer starting")
	printenv()

	if err := c.s3.Mkdirp(s3.Paths.Bucket); err != nil {
		return err
	}

	defer s3.StopListening(s3.Paths.Bucket)
	o, errs := s3.Listen(s3.Paths.Bucket, "", "")
	for {
		select {
		case err := <-errs:
			fmt.Fprintln(os.Stderr, err)

			// sleep for a bit
			time.Sleep(s)
		case <-o:
		}

		// fetch model
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
	s3.Touch(s3.Paths.Bucket, s3.Paths.AllDone)

	util.SleepBeforeExit()
	fmt.Fprintln(os.Stderr, "INFO The job should be all done now")
	return nil
}
