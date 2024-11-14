package util

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"lunchpail.io/pkg/be"
)

func WaitForRun(ctx context.Context, runname string, wait bool, backend be.Backend) (string, error) {
	alreadySaidWeAreWaiting := false

	for {
		if runname == "" {
			if latestRun, err := Latest(ctx, backend); err != nil {
				if wait && errors.Is(err, NoRunsFoundError) {
					if !alreadySaidWeAreWaiting {
						fmt.Fprintf(os.Stderr, "Waiting for runs...")
						alreadySaidWeAreWaiting = true
					}
					time.Sleep(2 * time.Second)
					continue
				} else {
					return "", err
				}
			} else {
				runname = latestRun.Name
			}
		}

		if alreadySaidWeAreWaiting {
			fmt.Fprintf(os.Stderr, "\n")
		}

		break
	}

	if runname == "" {
		return "", fmt.Errorf("Unable to find any runs")
	}

	return runname, nil
}
