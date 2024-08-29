//go:build full || observe

package kubernetes

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"

	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/lunchpail"
)

type LogLine struct {
	Timestamp time.Time
	Component lunchpail.Component
	Message   string
}

// Stream logs from a given Component to the given channel
func (streamer Streamer) podLogs(podName string, component lunchpail.Component, onlyInfo, follow bool, c chan events.Message) error {
	clientset, _, err := Client()
	if err != nil {
		return err
	}

	// TODO leak?
	go func() error {
		return streamLogUpdatesForPod(podName, streamer.backend.namespace, component, onlyInfo, follow, clientset, c)
	}()

	return nil
}

// TODO port this to use client-go
func (streamer Streamer) ComponentLogs(runname string, component lunchpail.Component, follow, verbose bool) error {
	containers := "main"
	runSelector := ",app.kubernetes.io/instance=" + runname

	followFlag := ""
	if follow {
		followFlag = "-f"
	}

	selector := "app.kubernetes.io/component=" + string(component) + runSelector
	cmdline := "kubectl logs -n " + streamer.backend.namespace + " -l " + selector + " --tail=-1 " + followFlag + " -c " + containers + " --max-log-requests=99 | grep -v 'workerpool worker'"

	if verbose {
		fmt.Fprintf(os.Stderr, "Tracking logs of component=%s\n", component)
		fmt.Fprintf(os.Stderr, "Tracking logs via cmdline=%s\n", cmdline)
	}

	cmd := exec.Command("/bin/sh", "-c", cmdline)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func streamLogUpdatesForWorker(podName, namespace string, c chan events.Message) error {
	clientset, _, err := Client()
	if err != nil {
		return err
	}

	// TODO leak?
	go func() error {
		return streamLogUpdatesForPod(podName, namespace, lunchpail.WorkersComponent, false, true, clientset, c)
	}()

	return nil
}

func streamLogUpdatesForPod(podName, namespace string, component lunchpail.Component, onlyInfo, follow bool, clientset *kubernetes.Clientset, c chan events.Message) error {
	for {
		tail := int64(500)
		logsStreamer, err := clientset.
			CoreV1().
			Pods(namespace).
			GetLogs(podName, &corev1.PodLogOptions{Follow: follow, TailLines: &tail}).
			Stream(context.Background())
		if err != nil {
			if !strings.Contains(err.Error(), "waiting to start") {
				return err
			} else {
				// retry...
				time.Sleep(1 * time.Second)
				continue
			}
		}

		defer logsStreamer.Close()

		sc := bufio.NewScanner(logsStreamer)
		for sc.Scan() {
			// TODO on time.Now() we could parse out the timestamps from the logs
			line := sc.Text()

			isInfo := strings.HasPrefix(line, "INFO")
			if isInfo {
				line = line[5:]
			} else {
				if onlyInfo {
					// only info lines and this isn't an info line
					continue
				}

				isDebug := strings.HasPrefix(line, "DEBUG")
				if isDebug {
					// TODO find some way to allow
					// users to enable showing
					// debug lines
					continue
				}
			}

			c <- events.Message{Timestamp: time.Now(), Who: lunchpail.ComponentShortName(component), Message: line}
		}

		break
	}

	return nil
}
