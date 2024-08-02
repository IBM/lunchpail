package util

import (
	"fmt"
	"os"
	"strings"
	"time"

	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/be"
)

func WaitForRun(runname, namespace string, wait bool, backend be.Backend) (string, string, string, error) {
	appname := assembly.Name()
	if namespace == "" {
		namespace = appname
	}

	waiting := true
	alreadySaidWeAreWaiting := false

	for waiting {
		if runname == "" {
			if singletonRun, err := Singleton(appname, namespace, backend); err != nil {
				if wait && strings.Contains(err.Error(), "No runs") {
					if !alreadySaidWeAreWaiting {
						fmt.Fprintf(os.Stderr, "Waiting for runs...")
						alreadySaidWeAreWaiting = true
					}
					time.Sleep(2 * time.Second)
					continue
				} else {
					return "", "", "", err
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

	return appname, runname, namespace, nil
}
