package workstealer

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

var debug = os.Getenv("DEBUG") != ""
var run = os.Getenv("RUN_NAME")
var queue = os.Getenv("LUNCHPAIL_QUEUE_PATH")
var inbox = filepath.Join(queue, os.Getenv("UNASSIGNED_INBOX"))
var finished = filepath.Join(queue, "finished")
var outbox = filepath.Join(queue, os.Getenv("FULLY_DONE_OUTBOX"))
var queues = filepath.Join(queue, os.Getenv("WORKER_QUEUES_SUBDIR"))

type client struct {
	s3    S3Client
	paths filepaths
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
	if duration, err := sleepyTime("SLEEP_BEFORE_EXIT", 10); err != nil {
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
	s3, err := newS3Client()
	if err != nil {
		return err
	}
	c := client{s3, pathsForRun()}
	s, err := sleepyTime("QUEUE_POLL_INTERVAL_SECONDS", 3)
	if err != nil {
		return err
	}

	fmt.Printf("INFO Workstealer starting")
	printenv()

	if err := launchMinioServer(); err != nil {
		return err
	}

	for {
		// fetch model
		m := c.fetchModel()
		m.report()

		// assess it
		if c.assess(m) {
			// all done
			break
		}

		// sleep for a bit
		time.Sleep(s)
	}

	sleepBeforeExit()
	fmt.Fprintln(os.Stderr, "INFO The job should be all done now")
	return nil
}