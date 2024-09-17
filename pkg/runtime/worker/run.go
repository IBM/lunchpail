package worker

import (
	"context"
	"fmt"
	"os"
	"time"

	"lunchpail.io/pkg/runtime/queue"
)

func delay() error {
	startupDelayStr := os.Getenv("LUNCHPAIL_STARTUP_DELAY")
	if startupDelayStr != "" {
		delay, err := time.ParseDuration(startupDelayStr + "s")
		if err != nil {
			return err
		}
		if delay > 0 {
			fmt.Fprintf(os.Stderr, "INFO Delaying startup by %d seconds\n", delay)
			time.Sleep(delay)
		}
	}

	return nil
}

func Run(ctx context.Context, handler []string, opts Options) error {
	fmt.Fprintf(os.Stderr, "INFO Lunchpail worker starting up\n")

	if opts.Debug {
		// helpful for debugging
		fmt.Fprintf(os.Stderr, "DEBUG env=%v\n", os.Environ())
	}

	if err := delay(); err != nil {
		return err
	}

	client, err := queue.NewS3Client(ctx)
	if err != nil {
		return err
	}

	return startWatch(ctx, handler, client, opts.Debug)
}
