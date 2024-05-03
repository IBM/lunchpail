package qstat

import (
	"bufio"
	"context"
	"fmt"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func stream(namespace string, follow bool, tail int64, c chan QstatModel) error {
	opts := v1.PodLogOptions{Follow: follow}
	if tail != -1 {
		opts.TailLines = &tail
	}

	kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return err
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return err
	}

	pods, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{LabelSelector: "app.kubernetes.io/component=workstealer"})
	if err != nil {
		return err
	} else if len(pods.Items) == 0 {
		return fmt.Errorf("Workstealer not found in namespace=%s\n", namespace)
	} else if len(pods.Items) > 1 {
		return fmt.Errorf("Multiple Workstealers found in namespace=%s\n", namespace)
	}

	podLogs := clientset.CoreV1().Pods(namespace).GetLogs(pods.Items[0].Name, &opts)
	stream, err := podLogs.Stream(context.TODO())
	if err != nil {
		return err
	}
	buffer := bufio.NewReader(stream)

	var model QstatModel = QstatModel{false, "", 0, 0, 0, 0, 0, []Worker{}, []Worker{}}
	for {
		line, err := buffer.ReadString('\n')
		if err != nil { // == io.EOF {
			break
		}

		if !strings.HasPrefix(line, "lunchpail.io") {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) == 0 {
			continue
		}

		marker := fields[1]
		if marker == "---" && model.Valid {
			c <- model
			model = QstatModel{true, "", 0, 0, 0, 0, 0, []Worker{}, []Worker{}}
			continue
		} else if len(fields) >= 3 {
			count, err := strconv.Atoi(fields[2])
			if err != nil {
				continue
			}

			if marker == "unassigned" {
				model.Valid = true
				model.Unassigned = count
				model.Timestamp = strings.Join(fields[4:], " ")
			} else if marker == "assigned" {
				model.Assigned = count
			} else if marker == "processing" {
				model.Processing = count
			} else if marker == "done" {
				count2, err := strconv.Atoi(fields[3])
				if err != nil {
					continue
				}

				model.Success = count
				model.Failure = count2
			} else if marker == "liveworker" || marker == "deadworker" {
				count2, err := strconv.Atoi(fields[3])
				if err != nil {
					continue
				}
				count3, err := strconv.Atoi(fields[4])
				if err != nil {
					continue
				}
				count4, err := strconv.Atoi(fields[5])
				if err != nil {
					continue
				}
				name := fields[6]

				worker := Worker{
					name, count, count2, count3, count4,
				}

				if marker == "liveworker" {
					model.LiveWorkers = append(model.LiveWorkers, worker)
				} else {
					model.DeadWorkers = append(model.DeadWorkers, worker)
				}
			}
		}
	}

	return nil
}
