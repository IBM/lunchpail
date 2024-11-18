package worker

import (
	"context"
	"fmt"
	"os"
	"time"

	s3 "lunchpail.io/pkg/runtime/queue"
)

func printenv() {
	for _, e := range os.Environ() {
		fmt.Fprintf(os.Stderr, "%v\n", e)
	}
}

func Run(ctx context.Context, handler []string, opts Options) error {
	if opts.LogOptions.Verbose {
		fmt.Fprintf(os.Stderr, "Worker starting up run=%s pack=%d step=%d pool=%s worker=%s\n", opts.RunContext.RunName, opts.Pack, opts.RunContext.Step, opts.RunContext.PoolName, opts.RunContext.WorkerName)
		printenv()
	}

	if opts.StartupDelay > 0 {
		if opts.LogOptions.Verbose {
			fmt.Fprintf(os.Stderr, "Worker delaying startup for %d seconds\n", opts.StartupDelay)
		}
		time.Sleep(time.Duration(opts.StartupDelay) * time.Second)
	}

	client, err := s3.NewS3Client(ctx)
	if err != nil {
		return err
	}

	return startWatch(ctx, handler, client, opts)
}
