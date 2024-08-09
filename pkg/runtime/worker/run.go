package worker

import (
	"fmt"
	"os"
	"time"
)

func Run(handler []string, opts Options) error {
	if opts.Debug {
		// helpful for debugging
		fmt.Println(os.Environ())
	}

	client, err := newS3Client()
	if err != nil {
		return err
	}

	paths := pathsForRun()

	startupDelayStr := os.Getenv("LUNCHPAIL_STARTUP_DELAY")
	delay, err := time.ParseDuration(startupDelayStr + "s")
	if err != nil {
		return err
	}
	if delay > 0 {
		fmt.Println("Delaying startup by " + startupDelayStr + " seconds")
		time.Sleep(delay)
	}

	return startWatch(handler, client, paths)
}
