package status

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"time"

	v1 "k8s.io/api/core/v1"
	watch "k8s.io/apimachinery/pkg/watch"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

type WorkerStatus string
const (
	Pending WorkerStatus = "Pending"
	Running = "Running"
	Succeeded = "Succeeded"
	Failed = "Failed"
	Terminating = "Terminating"
)

type Worker struct {
	Name string
	Status WorkerStatus
}

type Pool struct {
	Name string
	Workers []Worker
}
	
type Status struct {
	AppName string
	RunName string
	Pools []Pool
}

func (status *Status) numPools() int {
	return len(status.Pools)
}

func (status *Status) workers() []Worker {
	workers := []Worker{}
	for _, pool := range status.Pools {
		workers = slices.Concat(workers, pool.Workers)
	}
	return workers
}

func (status *Status) numWorkers() int {
	N := 0
	for _, pool := range status.Pools {
		N += len(pool.Workers)
	}
	return N
}

func startWatching(run, namespace string) (watch.Interface, error) {
	kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, err
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	timeout := int64(7 * 24 * time.Hour / time.Second)
	return clientset.CoreV1().Pods(namespace).Watch(context.Background(), metav1.ListOptions{
		TimeoutSeconds: &timeout,
		LabelSelector: "app.kubernetes.io/component=workerpool",
	})
}

func updateWorker(app, run string, pod *v1.Pod, status Status, what watch.EventType) (Status, error) {
	component, exists := pod.Labels["app.kubernetes.io/component"]
	if !exists {
		return status, fmt.Errorf("Worker without component label %s\n", pod.Name)
	}

	if component != "workerpool" {
		return status, nil
	}

	poolName, exists := pod.Labels["app.kubernetes.io/name"]
	if !exists {
		return status, fmt.Errorf("Worker without pool label %s\n", pod.Name)
	}

	runName, exists := pod.Labels["app.kubernetes.io/instance"]
	if !exists {
		return status, fmt.Errorf("Worker without run label %s\n", pod.Name)
	}

	appName, exists := pod.Labels["app.kubernetes.io/part-of"]
	if !exists {
		return status, fmt.Errorf("Worker without app label %s\n", pod.Name)
	}

	if appName != app || runName != run {
		return status, nil
	}

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

	idx := slices.IndexFunc(status.Pools, func(pool Pool) bool { return pool.Name == poolName })

	if idx < 0 {
		// couldn't find the Pool
		if what == watch.Deleted {
			// Deleted a Worker that in a Pool we haven't
			// yet seen; safe to ignore for now
			return status, nil
		} else  {
			// Added or Modified a Worker in a Pool we
			// haven't seen yet; create a record of both
			// the Pool and the Worker
			pool := Pool{poolName, []Worker{Worker{pod.Name, workerStatus}}}
			return Status{appName, runName, append(status.Pools, pool)}, nil
		}
	}

	// otherwise, we have seen the pool before
	pool := status.Pools[idx]

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
		return Status{appName, runName, append(status.Pools[:idx], status.Pools[idx+1:]...)}, nil
	} else {	
		return Status{appName, runName, slices.Concat(status.Pools[:idx], []Pool{pool}, status.Pools[idx+1:])}, nil
	}
}

func streamWorkerUpdates(app, run string, watcher watch.Interface, c chan Status) error {
	status := Status{}

	for event := range watcher.ResultChan() {
		if event.Type == watch.Added || event.Type == watch.Deleted || event.Type == watch.Modified {
			pod := event.Object.(*v1.Pod)
			newStatus, err := updateWorker(app, run, pod, status, event.Type)
			if err != nil {
				fmt.Fprintf(os.Stderr, "%v\n", err)
			} else {
				status = newStatus
				c <- status
			}
		}
	}
	
	return nil
}

func Stream(app, run, namespace string) (chan Status, error) {
	c := make(chan Status)

	watcher, err := startWatching(run, namespace)
	if err != nil {
		return c, err
	}

	go streamWorkerUpdates(app, run, watcher, c)

	return c, nil
}
