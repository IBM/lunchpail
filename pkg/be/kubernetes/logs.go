package kubernetes

import (
	"bufio"
	"context"
	"fmt"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"lunchpail.io/pkg/observe/events"
	"strings"
	"time"
)

type LogLine struct {
	Timestamp time.Time
	Component events.Component
	Message   string
}

func streamLogUpdatesForComponent(run, namespace string, component events.Component, onlyInfo bool, c chan events.Message) error {
	clientset, _, err := Client()
	if err != nil {
		return err
	}

	podName, err := findPodName(run, namespace, component, clientset)
	if err != nil {
		return err
	}

	return streamLogUpdatesForPod(podName, namespace, component, onlyInfo, clientset, c)
}

func streamLogUpdatesForWorker(podName, namespace string, c chan events.Message) error {
	clientset, _, err := Client()
	if err != nil {
		return err
	}

	// TODO leak?
	go func() error {
		return streamLogUpdatesForPod(podName, namespace, events.WorkersComponent, false, clientset, c)
	}()

	return nil
}

func streamLogUpdatesForPod(podName, namespace string, component events.Component, onlyInfo bool, clientset *kubernetes.Clientset, c chan events.Message) error {
	for {
		tail := int64(500)
		logsStreamer, err := clientset.
			CoreV1().
			Pods(namespace).
			GetLogs(podName, &corev1.PodLogOptions{Follow: true, TailLines: &tail}).
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

			c <- events.Message{Timestamp: time.Now(), Who: events.ComponentShortName(component), Message: line}
		}

		break
	}

	return nil
}

func findPodName(run, namespace string, component events.Component, clientset *kubernetes.Clientset) (string, error) {
	for {
		listOptions := metav1.ListOptions{
			LabelSelector: "app.kubernetes.io/component=" + string(component) + ",app.kubernetes.io/instance=" + run,
		}

		if pods, err := clientset.
			CoreV1().
			Pods(namespace).
			List(context.Background(), listOptions); err != nil {
			return "", err
		} else if len(pods.Items) == 0 {
			time.Sleep(1 * time.Second)
		} else if len(pods.Items) != 1 {
			return "", fmt.Errorf("Multiple %v instances found for run=%s namespace=%s\n", component, run, namespace)
		} else {
			return pods.Items[0].Name, nil
		}
	}
}
