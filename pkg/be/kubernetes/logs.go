package kubernetes

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"

	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/lunchpail"
)

type LogLine struct {
	Timestamp time.Time
	Component lunchpail.Component
	Message   string
}

// TODO port this to use client-go
func (streamer Streamer) ComponentLogs(component lunchpail.Component, opts streamer.LogOptions) error {
	containers := "main"
	runSelector := ",app.kubernetes.io/instance=" + streamer.run.RunName

	followFlag := ""
	if opts.Follow {
		followFlag = "-f"
	}

	selector := "app.kubernetes.io/component=" + string(component) + runSelector
	cmdline := "kubectl logs -n " + streamer.backend.namespace + " -l " + selector + " --tail=" + strconv.Itoa(opts.Tail) + " " + followFlag + " -c " + containers + " --max-log-requests=99"

	for {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Starting log tracking via cmdline=%s\n", cmdline)
		}

		cmd := exec.Command("/bin/sh", "-c", cmdline)
		cmd.Stdout = os.Stdout
		if opts.Writer != nil {
			cmd.Stdout = opts.Writer
		}

		stderr, err := cmd.StderrPipe()
		if err != nil {
			return err
		}

		if err := cmd.Start(); err != nil {
			if !strings.Contains(err.Error(), "signal:") {
				fmt.Fprintf(os.Stderr, "Error tracking component logs %v: %v\n", component, err)
				return err
			} else {
				// swallow signal: interrupt/killed
				return nil
			}
		}

		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Now tracking component logs for %v\n", component)
		}

		// Filter out not found error messages. We will retry.
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			if !strings.Contains(line, "No resources found") && !strings.Contains(line, "waiting to start") {
				fmt.Fprintln(os.Stderr, line)
			}
		}

		if err := cmd.Wait(); err == nil {
			break
		} else {
			if opts.Verbose {
				fmt.Fprintf(os.Stderr, "Error tracking component logs %v: %v\n", component, err)
			}
			select {
			case <-streamer.Context.Done():
				return nil
			default:
				time.Sleep(500 * time.Millisecond)
				continue
			}
		}
	}

	return nil
}

func streamLogUpdatesForPod(ctx context.Context, podName, namespace string, component lunchpail.Component, onlyInfo, follow bool, clientset *kubernetes.Clientset, c chan events.Message) error {
	for {
		tail := int64(500)
		logsStreamer, err := clientset.
			CoreV1().
			Pods(namespace).
			GetLogs(podName, &corev1.PodLogOptions{Follow: follow, TailLines: &tail}).
			Stream(ctx)
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
