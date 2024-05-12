package status

import (
	"fmt"
	"os"
	"slices"
	"strings"
	"time"

	v1 "k8s.io/api/core/v1"
	watch "k8s.io/apimachinery/pkg/watch"
	"lunchpail.io/pkg/lunchpail"
)

func statusFromPod(pod *v1.Pod) WorkerStatus {
	workerStatus := Pending

	if pod.DeletionTimestamp != nil {
		workerStatus = Terminating
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
				workerStatus = Running
			} else {
				workerStatus = Booting
			}
		case v1.PodSucceeded:
			workerStatus = Succeeded
		case v1.PodFailed:
			workerStatus = Failed
		}
	}

	return workerStatus
}

func updateWorker(pod *v1.Pod, pools []Pool, what watch.EventType) ([]Pool, int, WorkerStatus, error) {
	workerStatus := statusFromPod(pod)
	poolName, exists := pod.Labels["app.kubernetes.io/name"]
	if !exists {
		return pools, -1, workerStatus, fmt.Errorf("Worker without pool label %s\n", pod.Name)
	}

	// index of pool in `pools`
	pidx := slices.IndexFunc(pools, func(pool Pool) bool { return pool.Name == poolName })

	if pidx < 0 {
		// couldn't find the Pool
		if what == watch.Deleted {
			// Deleted a Worker that in a Pool we haven't
			// yet seen; safe to ignore for now
			return pools, -1, workerStatus, nil
		} else {
			// Added or Modified a Worker in a Pool we
			// haven't seen yet; create a record of both
			// the Pool and the Worker
			pool := Pool{poolName, []Worker{Worker{pod.Name, workerStatus}}}
			return append(pools, pool), len(pools), workerStatus, nil
		}
	}

	// otherwise, we have seen the pool before
	pool := pools[pidx]

	// worker index in `pool.Workers`
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
			pool.Workers = slices.Concat(pool.Workers[:widx], []Worker{worker}, pool.Workers[widx+1:])
		}
	} else {
		// known Pool but unknown Worker
		pool.Workers = append(pool.Workers, Worker{pod.Name, workerStatus})
	}

	if len(pool.Workers) == 0 {
		// Pool with no Workers; remove record of it
		return append(pools[:pidx], pools[pidx+1:]...), pidx, workerStatus, nil
	} else {
		return slices.Concat(pools[:pidx], []Pool{pool}, pools[pidx+1:]), pidx, workerStatus, nil
	}
}

func updateFromPod(pod *v1.Pod, status *Status, what watch.EventType) error {
	component, exists := pod.Labels["app.kubernetes.io/component"]
	if !exists {
		return fmt.Errorf("Worker without component label %s\n", pod.Name)
	}

	name := pod.Name
	var workerStatus WorkerStatus

	switch component {
	case string(lunchpail.RuntimeComponent):
		name = "Runtime"
		workerStatus = statusFromPod(pod)
		status.Runtime = workerStatus
	case string(lunchpail.InternalS3Component):
		name = "Queue"
		workerStatus = statusFromPod(pod)
		status.InternalS3 = workerStatus
	case string(lunchpail.WorkStealerComponent):
		name = "Workstealer"
		workerStatus = statusFromPod(pod)
		status.WorkStealer = workerStatus
	case string(lunchpail.WorkersComponent):
		if pools, poolIdx, theWorkerStatus, err := updateWorker(pod, status.Pools, what); err != nil {
			return err
		} else {
			status.Pools = pools
			workerStatus = theWorkerStatus

			if workerIdx, exists := pod.Annotations["batch.kubernetes.io/job-completion-index"]; exists {
				name = fmt.Sprintf("Worker %s Pool %d", workerIdx, poolIdx)
			}
		}
	}

	status.LastEvent = Event{name + " " + strings.ToLower(string(workerStatus)), time.Now()}
	return nil
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
