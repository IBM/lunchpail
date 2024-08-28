package workstealer

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	q "lunchpail.io/pkg/runtime/queue"
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

func sleepyTime(envvar string, defaultValue int) (time.Duration, error) {
	t := defaultValue
	if os.Getenv(envvar) != "" {
		if s, err := strconv.Atoi(os.Getenv(envvar)); err != nil {
			return time.Second, fmt.Errorf("%s not an integer: %s", envvar, os.Getenv(envvar))
		} else {
			t = s
		}
	}

	return time.Duration(t) * time.Second, nil
}

// If tests need to capture some output before we exit, they can
// increase this. Otherwise, we will have a default grace period to
// allow for UIs e.g. to do a last poll of queue info.
func sleepBeforeExit() error {
	if duration, err := sleepyTime("LUNCHPAIL_SLEEP_BEFORE_EXIT", 10); err != nil {
		return err
	} else {
		time.Sleep(duration)
	}
	return nil
}

func printenv() {
	for _, e := range os.Environ() {
		fmt.Fprintf(os.Stderr, "%v\n", e)
	}
}

func Run() error {
	s3, err := q.NewS3Client()
	if err != nil {
		return err
	}
	c := client{s3}

	s, err := sleepyTime("QUEUE_POLL_INTERVAL_SECONDS", 3)
	if err != nil {
		return err
	}

	fmt.Printf("INFO Workstealer starting")
	printenv()

	if err := c.s3.Mkdirp(s3.Paths.Bucket); err != nil {
		return err
	}

	for {
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

		// sleep for a bit
		time.Sleep(s)
	}

	// Drop a final breadcrumb indicating we are ready to tear
	// down all associated resources
	s3.Touch(s3.Paths.Bucket, s3.Paths.AllDone)

	sleepBeforeExit()
	fmt.Fprintln(os.Stderr, "INFO The job should be all done now")
	return nil
}
