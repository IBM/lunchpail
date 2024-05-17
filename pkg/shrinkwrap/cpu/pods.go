package cpu

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"slices"
	"strconv"

	v1 "k8s.io/api/core/v1"
	watch "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/tools/remotecommand"
	"lunchpail.io/pkg/kubernetes"
	"lunchpail.io/pkg/lunchpail"
)

func execIntoPod(pod *v1.Pod, component lunchpail.Component, model *Model, intervalSeconds int, c chan *Model) error {
	cmd := []string{"/bin/sh", "-c", `while true; do cd /sys/fs/cgroup;f=cpu/cpuacct.usage;if [ -f $f ]; then s=1000000000;b=$(cat $f);sleep 1;e=$(cat $f);else f=cpu.stat;s=1000000;b=$(cat $f|head -1|cut -d" " -f2);sleep 1;e=$(cat $f|head -1|cut -d" " -f2);fi;printf "%.2f\n" $(echo "($e-$b)/($s)*100"|bc -l); sleep ` + strconv.Itoa(intervalSeconds) + `; done`}

	clientset, kubeConfig, err := kubernetes.Client()
	if err != nil {
		return err
	}
	
	req := clientset.CoreV1().RESTClient().Post().Resource("pods").Name(pod.Name).
		Namespace(pod.Namespace).SubResource("exec")

	option := &v1.PodExecOptions{
		Command: cmd,
		Stdin:   false,
		Stdout:  true,
		Stderr:  true,
		TTY:     false,
	}

	req.VersionedParams(
		option,
		scheme.ParameterCodec,
	)

	exec, err := remotecommand.NewSPDYExecutor(kubeConfig, "POST", req.URL())
	if err != nil {
		return err
	}

	reader, writer := io.Pipe()

	go func() {
		buffer := bufio.NewReader(reader)
		for {
			line, err := buffer.ReadString('\n')
			if err != nil { // == io.EOF {
				break
			}

			util, err := strconv.ParseFloat(line, 32)
			if err != nil {
				workerIdx := slices.IndexFunc(model.Workers, func(worker Worker) bool { return worker.Name == pod.Name })
				if workerIdx < 0 {
					model.Workers = append(model.Workers, Worker{pod.Name, component, util})
				} else {
					model.Workers[workerIdx].CpuUtil = util
				}

				c <- model
			}
		}
	}()

	if err = exec.Stream(remotecommand.StreamOptions{
		Stdin:  nil,
		Stdout: writer,
		Stderr: os.Stderr,
	}); err != nil {
		return err
	}

	return nil
}

func updateFromPod(pod *v1.Pod, what watch.EventType, model *Model, intervalSeconds int, c chan *Model) error {
	componentName, exists := pod.Labels["app.kubernetes.io/component"]
	if !exists {
		return fmt.Errorf("Worker without component label %s\n", pod.Name)
	}

	var component lunchpail.Component
	switch componentName {
	case string(lunchpail.DispatcherComponent):
		component = lunchpail.DispatcherComponent
	case string(lunchpail.WorkersComponent):
		component = lunchpail.WorkersComponent
	}
	
	if component != "" && pod.Status.Phase == "Running" {
		go execIntoPod(pod, component, model, intervalSeconds, c)
	}

	return nil
}

func (model *Model) streamPodUpdates(watcher watch.Interface, intervalSeconds int, c chan *Model) error {
	for event := range watcher.ResultChan() {
		if event.Type == watch.Added || event.Type == watch.Deleted || event.Type == watch.Modified {
			pod := event.Object.(*v1.Pod)
			if err := updateFromPod(pod, event.Type, model, intervalSeconds, c); err != nil {
				fmt.Fprintf(os.Stderr, "%v\n", err)
			}
		}
	}

	return nil
}
