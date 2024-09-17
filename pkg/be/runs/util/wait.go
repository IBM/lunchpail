package util

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"lunchpail.io/pkg/be"
)

func WaitForRun(ctx context.Context, runname string, wait bool, backend be.Backend) (string, error) {
	alreadySaidWeAreWaiting := false

	for {
		if runname == "" {
			if singletonRun, err := Singleton(ctx, backend); err != nil {
				if wait && strings.Contains(err.Error(), "No runs") {
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
				runname = singletonRun.Name
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
