package kubernetes

import (
	"context"
	"fmt"
	"os"
	"time"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	watch "k8s.io/apimachinery/pkg/watch"

	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/lunchpail"
)

func startWatching(run, namespace string) (watch.Interface, error) {
	clientset, _, err := Client()
	if err != nil {
		return nil, err
	}

	timeout := timeoutSeconds
	podWatcher, err := clientset.CoreV1().Pods(namespace).Watch(context.Background(), metav1.ListOptions{
		TimeoutSeconds:  &timeout,
		ResourceVersion: "",
		LabelSelector:   "app.kubernetes.io/component,app.kubernetes.io/instance=" + run,
	})
	if err != nil {
		return nil, err
	}

	return podWatcher, nil
}

func statusFromPod(pod *v1.Pod) events.WorkerStatus {
	workerStatus := events.Pending

	if pod.DeletionTimestamp != nil {
		workerStatus = events.Terminating
	} else {
		switch pod.Status.Phase {
		case v1.PodRunning:
			ready := true
			for _, cs := range pod.Status.ContainerStatuses {
				if !cs.Ready {
					ready = false
					break
				}
			}
			if ready {
				workerStatus = events.Running
			} else {
				workerStatus = events.Booting
			}
		case v1.PodSucceeded:
			workerStatus = events.Succeeded
		case v1.PodFailed:
			workerStatus = events.Failed
		}
	}

	return workerStatus
}

func (streamer Streamer) updateFromPod(pod *v1.Pod, what watch.EventType, cc chan events.ComponentUpdate, cm chan events.Message) error {
	component, exists := pod.Labels["app.kubernetes.io/component"]
	if !exists {
		return fmt.Errorf("Worker without component label %s\n", pod.Name)
	}

	workerStatus := statusFromPod(pod)

	switch component {
	case string(lunchpail.WorkStealerComponent):
		if what == watch.Added {
			// new workerstealer pod. start streaming its logs
			if err := streamer.podLogs(pod.Name, lunchpail.WorkStealerComponent, true, true, cm); err != nil {
				return err
			}
		}
		cc <- events.WorkStealerUpdate(pod.Namespace, streamer.backend, workerStatus, events.EventType(what))
	case string(lunchpail.DispatcherComponent):
		if what == watch.Added {
			// new dispatcher pod. start streaming its logs
			if err := streamer.podLogs(pod.Name, lunchpail.DispatcherComponent, false, true, cm); err != nil {
				return err
			}
		}
		cc <- events.DispatcherUpdate(pod.Namespace, streamer.backend, workerStatus, events.EventType(what))
	case string(lunchpail.WorkersComponent):
		if what == watch.Added {
			// new worker pod. start streaming its logs
			if err := streamLogUpdatesForWorker(streamer.Context, pod.Name, pod.Namespace, cm); err != nil {
				return err
			} else {
				// TODO: are we leaking something
				// here? do we need to add this to the
				// top-level errgroup.Wait in
				// ./stream.go?
			}
		}

		poolName, exists := pod.Labels["app.kubernetes.io/name"]
		if !exists {
			return fmt.Errorf("Worker without pool name label %s\n", pod.Name)
		}

		cc <- events.WorkerUpdate(pod.Name, pod.Namespace, poolName, streamer.backend, workerStatus, events.EventType(what))
	}

	return nil
}

func timeOf(pod *v1.Pod) time.Time {
	last := time.Now()
	for _, condition := range pod.Status.Conditions {
		t := condition.LastTransitionTime
		if !t.IsZero() && last.Before(t.Time) {
			last = t.Time
		}
	}

	return last
}

func (streamer Streamer) streamPodUpdates(watcher watch.Interface, cc chan events.ComponentUpdate, cm chan events.Message) {
	for event := range watcher.ResultChan() {
		if event.Type == watch.Added || event.Type == watch.Deleted || event.Type == watch.Modified {
			pod := event.Object.(*v1.Pod)
			if err := streamer.updateFromPod(pod, event.Type, cc, cm); err != nil {
				fmt.Fprintf(os.Stderr, "%v\n", err)
			}
		}
	}
}

func (streamer Streamer) RunComponentUpdates() (chan events.ComponentUpdate, chan events.Message, error) {
	watcher, err := startWatching(streamer.runname, streamer.backend.namespace)
	if err != nil {
		return nil, nil, err
	}

	cc := make(chan events.ComponentUpdate)
	cm := make(chan events.Message)
	go streamer.streamPodUpdates(watcher, cc, cm)
	return cc, cm, nil
}
