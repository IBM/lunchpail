package status

import (
	"bufio"
	"context"
	"fmt"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	k8s "lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/lunchpail"
	"strings"
	"time"
)

type LogLine struct {
	Timestamp time.Time
	Component lunchpail.Component
	Message   string
}

func (model *Model) streamLogUpdates(run, namespace string, component lunchpail.Component, c chan Model) error {
	clientset, _, err := k8s.Client()
	if err != nil {
		return err
	}

	podName, err := findPodName(run, namespace, component, clientset)
	if err != nil {
		return err
	}

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
			if model.addMessage(Message{time.Now(), lunchpail.ComponentShortName(component), sc.Text()}) {
				c <- *model
			}
		}

		break
	}

	return nil
}

func findPodName(run, namespace string, component lunchpail.Component, clientset *kubernetes.Clientset) (string, error) {
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
