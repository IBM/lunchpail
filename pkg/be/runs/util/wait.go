package util

import (
	"fmt"
	"os"
	"strings"
	"time"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
)

func WaitForRun(runname string, wait bool, backend be.Backend) (string, string, error) {
	appname := compilation.Name()
	alreadySaidWeAreWaiting := false

	for {
		if runname == "" {
			if singletonRun, err := Singleton(appname, backend); err != nil {
				if wait && strings.Contains(err.Error(), "No runs") {
					if !alreadySaidWeAreWaiting {
						fmt.Fprintf(os.Stderr, "Waiting for runs...")
						alreadySaidWeAreWaiting = true
					}
					time.Sleep(2 * time.Second)
					continue
				} else {
					return "", "", err
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
		return "", "", fmt.Errorf("Unable to find any runs for application %s\n", appname)
	}

	return appname, runname, nil
}
