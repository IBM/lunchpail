package status

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"time"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	watch "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"lunchpail.io/pkg/lunchpail"
)

func startWatching(app, run, namespace string) (watch.Interface, watch.Interface, error) {
	kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, nil, err
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, nil, err
	}

	timeoutSeconds := int64(7 * 24 * time.Hour / time.Second)

	podWatcher, err := clientset.CoreV1().Pods(namespace).Watch(context.Background(), metav1.ListOptions{
		TimeoutSeconds: &timeoutSeconds,
		LabelSelector:  "app.kubernetes.io/component,app.kubernetes.io/part-of=" + app + ",app.kubernetes.io/instance=" + run,
	})
	if err != nil {
		return nil, nil, err
	}

	eventWatcher, err := clientset.CoreV1().Events(namespace).Watch(context.Background(), metav1.ListOptions{
		TimeoutSeconds: &timeoutSeconds,
	})
	if err != nil {
		return nil, nil, err
	}

	return podWatcher, eventWatcher, nil
}

func updateFromPod(pod *v1.Pod, status *Status, what watch.EventType) error {
	component, exists := pod.Labels["app.kubernetes.io/component"]
	if !exists {
		return fmt.Errorf("Worker without component label %s\n", pod.Name)
	}

	switch component {
	case string(lunchpail.RuntimeComponent):
		status.Runtime = statusFromPod(pod)
	case string(lunchpail.InternalS3Component):
		status.InternalS3 = statusFromPod(pod)
	case string(lunchpail.WorkersComponent):
		if pools, err := updateWorker(pod, status.Pools, what); err != nil {
			return err
		} else {
			status.Pools = pools
		}
	}

	return nil
}

func statusFromPod(pod *v1.Pod) WorkerStatus {
	workerStatus := Pending
	if pod.DeletionTimestamp != nil {
		workerStatus = Terminating
	} else {
		switch pod.Status.Phase {
		case v1.PodPending:
			workerStatus = Pending
		case v1.PodRunning:
			workerStatus = Running
		case v1.PodSucceeded:
			workerStatus = Succeeded
		case v1.PodFailed:
			workerStatus = Failed
		}
	}

	return workerStatus
}

func updateWorker(pod *v1.Pod, pools []Pool, what watch.EventType) ([]Pool, error) {
	poolName, exists := pod.Labels["app.kubernetes.io/name"]
	if !exists {
		return pools, fmt.Errorf("Worker without pool label %s\n", pod.Name)
	}

	workerStatus := statusFromPod(pod)
	idx := slices.IndexFunc(pools, func(pool Pool) bool { return pool.Name == poolName })

	if idx < 0 {
		// couldn't find the Pool
		if what == watch.Deleted {
			// Deleted a Worker that in a Pool we haven't
			// yet seen; safe to ignore for now
			return pools, nil
		} else {
			// Added or Modified a Worker in a Pool we
			// haven't seen yet; create a record of both
			// the Pool and the Worker
			pool := Pool{poolName, []Worker{Worker{pod.Name, workerStatus}}}
			return append(pools, pool), nil
		}
	}

	// otherwise, we have seen the pool before
	pool := pools[idx]

	widx := slices.IndexFunc(pool.Workers, func(worker Worker) bool { return worker.Name == pod.Name })
	if widx >= 0 {
		// known Pool and known Worker
		if what == watch.Deleted {
			// Remove record of Deleted Worker in known
			// Pool by splicing it out of the Workers slice
			pool.Workers = append(pool.Workers[:widx], pool.Workers[widx+1:]...)
		} else {
			worker := pool.Workers[widx]
			worker.Status = workerStatus
			pool.Workers = slices.Concat(pool.Workers[:idx], []Worker{worker}, pool.Workers[widx+1:])
		}
	} else {
		// known Pool but unknown Worker
		pool.Workers = append(pool.Workers, Worker{pod.Name, workerStatus})
	}

	if len(pool.Workers) == 0 {
		// Pool with no Workers; remove record of it
		return append(pools[:idx], pools[idx+1:]...), nil
	} else {
		return slices.Concat(pools[:idx], []Pool{pool}, pools[idx+1:]), nil
	}
}

func streamPodUpdates(status *Status, watcher watch.Interface, c chan Status) error {
	for event := range watcher.ResultChan() {
		if event.Type == watch.Added || event.Type == watch.Deleted || event.Type == watch.Modified {
			pod := event.Object.(*v1.Pod)
			if err := updateFromPod(pod, status, event.Type); err != nil {
				fmt.Fprintf(os.Stderr, "%v\n", err)
			} else {
				c <- *status
			}
		}
	}

	return nil
}

func streamEventUpdates(status *Status, watcher watch.Interface, c chan Status) error {
	for watchEvent := range watcher.ResultChan() {
		event := watchEvent.Object.(*v1.Event)

		if status.LastEvent.Timestamp.IsZero() || event.LastTimestamp.After(status.LastEvent.Timestamp.Time) {
			status.LastEvent = Event{event.Message, event.LastTimestamp}
			c <- *status
		}
	}

	return nil
}

func StreamStatus(app, run, namespace string) (chan Status, error) {
	c := make(chan Status)

	podWatcher, eventWatcher, err := startWatching(app, run, namespace)
	if err != nil {
		return c, err
	}

	status := Status{}
	status.AppName = app
	status.RunName = run

	go streamPodUpdates(&status, podWatcher, c)
	go streamEventUpdates(&status, eventWatcher, c)

	return c, nil
}
