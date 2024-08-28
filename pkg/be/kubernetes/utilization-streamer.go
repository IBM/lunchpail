//go:build full || observe

package kubernetes

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"slices"
	"strconv"
	"strings"

	v1 "k8s.io/api/core/v1"
	watch "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/tools/remotecommand"

	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/lunchpail"
)

func (streamer Streamer) execIntoPod(pod *v1.Pod, component lunchpail.Component, model *utilization.Model, intervalSeconds int, c chan utilization.Model) error {
	sleep := strconv.Itoa(intervalSeconds)
	sleepNanos := sleep + "000000000"
	sleepMicros := sleep + "000000"

	mem := `$(cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2> /dev/null || cat /sys/fs/cgroup/memory.current) $(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2> /dev/null || cat /sys/fs/cgroup/memory.max)`

	cmd := []string{"/bin/sh", "-c", `while true; do cd /sys/fs/cgroup;f=cpu/cpuacct.usage;if [ -f $f ]; then s=` + sleepNanos + `;b=$(cat $f);sleep ` + sleep + `;e=$(cat $f);else f=cpu.stat;s=` + sleepMicros + `;b=$(cat $f|head -1|cut -d" " -f2);sleep ` + sleep + `;e=$(cat $f|head -1|cut -d" " -f2);fi;printf "%.2f %d %s\n" $(echo "($e-$b)/($s)*100"|bc -l) ` + mem + `; done`}

	clientset, kubeConfig, err := Client()
	if err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		return err
	}

	req := clientset.CoreV1().RESTClient().Post().Resource("pods").Name(pod.Name).
		Namespace(pod.Namespace).SubResource("exec")

	container := "app"
	if component == lunchpail.DispatcherComponent {
		container = "main"
	}

	option := &v1.PodExecOptions{
		Container: container,
		Command:   cmd,
		Stdin:     false,
		Stdout:    true,
		Stderr:    true,
		TTY:       false,
	}

	req.VersionedParams(
		option,
		scheme.ParameterCodec,
	)

	exec, err := remotecommand.NewSPDYExecutor(kubeConfig, "POST", req.URL())
	if err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		return err
	}

	reader, writer := io.Pipe()

	model.Workers = append(model.Workers, utilization.Worker{Name: pod.Name, Component: component})

	go func() {
		buffer := bufio.NewReader(reader)
		for {
			line, err := buffer.ReadString('\n')
			if err != nil { // == io.EOF {
				break
			}

			workerIdx := slices.IndexFunc(model.Workers, func(worker utilization.Worker) bool { return worker.Name == pod.Name })
			if workerIdx >= 0 {
				changed := false
				worker := model.Workers[workerIdx]
				fields := strings.Fields(line)

				if len(fields) >= 2 {
					if util, err := strconv.ParseFloat(fields[0], 32); err == nil {
						changed = true
						worker.CpuUtil = util
					}

					if util, err := strconv.ParseInt(fields[1], 10, 64); err == nil {
						changed = true
						worker.MemoryBytes = uint64(util)
					}
				}

				if changed {
					model.Workers = slices.Concat(model.Workers[:workerIdx], []utilization.Worker{worker}, model.Workers[workerIdx+1:])
					c <- *model
				}
			}
		}
	}()

	if err = exec.Stream(remotecommand.StreamOptions{
		Stdin:  nil,
		Stdout: writer,
		Stderr: os.Stderr,
	}); err != nil {
		if !strings.Contains(err.Error(), "terminated") {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}

	return nil
}

func (streamer Streamer) utilizationUpdateFromPod(pod *v1.Pod, what watch.EventType, intervalSeconds int, c chan utilization.Model, model *utilization.Model) error {
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

	if component != "" && pod.Status.Phase == "Running" && !streamer.alreadyExecdIntoPod(pod, model) {
		go streamer.execIntoPod(pod, component, model, intervalSeconds, c)
	}

	return nil
}

func (streamer Streamer) alreadyExecdIntoPod(pod *v1.Pod, model *utilization.Model) bool {
	return slices.IndexFunc(model.Workers, func(worker utilization.Worker) bool { return worker.Name == pod.Name }) >= 0
}

func (streamer Streamer) streamPodUtilizationUpdates(watcher watch.Interface, intervalSeconds int, c chan utilization.Model, model *utilization.Model) error {
	for event := range watcher.ResultChan() {
		if event.Type == watch.Added || event.Type == watch.Deleted || event.Type == watch.Modified {
			pod := event.Object.(*v1.Pod)
			if err := streamer.utilizationUpdateFromPod(pod, event.Type, intervalSeconds, c, model); err != nil {
				fmt.Fprintf(os.Stderr, "%v\n", err)
			}
		}
	}

	return nil
}
