package util

import (
	"fmt"
	"os"
	"strings"
	"time"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/compilation"
)

func WaitForRun(runname, namespace string, wait bool, backend be.Backend) (string, string, string, error) {
	appname := compilation.Name()
	if namespace == "" {
		namespace = appname
	}

	alreadySaidWeAreWaiting := false

	for {
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

	if runname == "" {
		return "", "", "", fmt.Errorf("Unable to find any runs for application %s in namespace %s\n", appname, namespace)
	}

	return appname, runname, namespace, nil
}
