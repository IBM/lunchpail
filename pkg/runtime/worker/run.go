package worker

import (
	"context"
	"fmt"
	"os"
	"time"

	"lunchpail.io/pkg/runtime/queue"
)

func printenv() {
	for _, e := range os.Environ() {
		fmt.Fprintf(os.Stderr, "%v\n", e)
	}
}

func Run(ctx context.Context, handler []string, opts Options) error {
	if opts.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "Lunchpail worker starting up\n")
		printenv()
	}

	if opts.LogOptions.Debug {
		// helpful for debugging
		fmt.Fprintf(os.Stderr, "env=%v\n", os.Environ())
	}

	if opts.StartupDelay > 0 {
		time.Sleep(time.Duration(opts.StartupDelay) * time.Second)
	}

	client, err := queue.NewS3Client(ctx)
	if err != nil {
		return err
	}

	return startWatch(ctx, handler, client, opts)
}
