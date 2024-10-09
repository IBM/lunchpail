package worker

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
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
			fmt.Fprintf(os.Stderr, "Delaying startup by %d seconds\n", delay)
			time.Sleep(delay)
		}
	}

	return nil
}

func Run(ctx context.Context, handler []string, opts Options) error {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Lunchpail worker starting up\n")
	}

	if opts.Debug {
		// helpful for debugging
		fmt.Fprintf(os.Stderr, "env=%v\n", os.Environ())
	}

	if err := delay(); err != nil {
		return err
	}

	client, err := queue.NewS3Client(ctx)
	if err != nil {
		return err
	}

	venvPath := os.Getenv("LUNCHPAIL_VENV_CACHEDIR")
	if d, err := os.Stat(venvPath); err == nil && d.IsDir() {
		venvBin := filepath.Join(venvPath, "bin")
		if d, err := os.Stat(venvBin); err == nil && d.IsDir() {
			if err := os.Setenv("PATH", venvBin+":"+os.Getenv("PATH")); err != nil {
				return fmt.Errorf("PATH cannot be updated with: %s", venvBin)
			}
		}
	}

	return startWatch(ctx, handler, client, opts.Debug)
}
