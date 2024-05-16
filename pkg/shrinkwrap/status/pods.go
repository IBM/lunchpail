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
	"lunchpail.io/pkg/shrinkwrap/qstat"
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

func updateWorker(name string, pod *v1.Pod, pools []Pool, what watch.EventType) ([]Pool, int, WorkerStatus, error) {
	workerStatus := statusFromPod(pod)
	poolName, exists := pod.Labels["app.kubernetes.io/name"]
	if !exists {
		return pools, -1, workerStatus, fmt.Errorf("Worker without pool label %s\n", name)
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
			pool := Pool{poolName, pod.Namespace, 1, []Worker{Worker{name, workerStatus, qstat.Worker{}}}}
			return append(pools, pool), len(pools), workerStatus, nil
		}
	}

	// otherwise, we have seen the pool before
	pool := pools[pidx]

	// worker index in `pool.Workers`
	widx := slices.IndexFunc(pool.Workers, func(worker Worker) bool { return worker.Name == name })
	if widx >= 0 {
		// known Pool and known Worker
		if what == watch.Deleted {
			// Remove record of Deleted Worker in known
			// Pool by splicing it out of the Workers slice
			pool.Workers = append(pool.Workers[:widx], pool.Workers[widx+1:]...)
			pool.Parallelism = len(pool.Workers)
		} else {
			worker := pool.Workers[widx]
			worker.Status = workerStatus
			pool.Workers = slices.Concat(pool.Workers[:widx], []Worker{worker}, pool.Workers[widx+1:])
			pool.Parallelism = len(pool.Workers)
		}
	} else {
		// known Pool but unknown Worker
		pool.Workers = append(pool.Workers, Worker{name, workerStatus, qstat.Worker{}})
	}

	//if len(pool.Workers) == 0 {
	//		// Pool with no Workers; remove record of it
	//		return append(pools[:pidx], pools[pidx+1:]...), pidx, workerStatus, nil
	//	} else {
	return slices.Concat(pools[:pidx], []Pool{pool}, pools[pidx+1:]), pidx, workerStatus, nil
	// }
}

func updateFromPod(pod *v1.Pod, model *Model, what watch.EventType) (bool, error) {
	component, exists := pod.Labels["app.kubernetes.io/component"]
	if !exists {
		return false, fmt.Errorf("Worker without component label %s\n", pod.Name)
	}

	name := pod.Name

	if component == string(lunchpail.WorkersComponent) {
		poolname, exists := pod.Labels["app.kubernetes.io/name"]
		if !exists {
			return false, fmt.Errorf("Worker without pool name label %s\n", pod.Name)
		}
		completionIdx, exists := pod.Annotations["batch.kubernetes.io/job-completion-index"]
		if !exists {
			return false, fmt.Errorf("Worker without completion index annotation %s\n", pod.Name)
		}

		// see watcher.sh remote=... TODO avoid these disparate hacks
		lastDashIdx := strings.LastIndex(pod.Name, "-")
		suffix := pod.Name[lastDashIdx+1:]
		name = fmt.Sprintf("%s.w%s.%s", poolname, completionIdx, suffix)
	}

	var workerStatus WorkerStatus
	switch component {
	case string(lunchpail.RuntimeComponent):
		name = lunchpail.ComponentShortName(lunchpail.RuntimeComponent)
		workerStatus = statusFromPod(pod)
		model.Runtime = workerStatus
	case string(lunchpail.InternalS3Component):
		name = lunchpail.ComponentShortName(lunchpail.InternalS3Component)
		workerStatus = statusFromPod(pod)
		model.InternalS3 = workerStatus
	case string(lunchpail.WorkStealerComponent):
		name = lunchpail.ComponentShortName(lunchpail.WorkStealerComponent)
		workerStatus = statusFromPod(pod)
		model.WorkStealer = workerStatus
	case string(lunchpail.DispatcherComponent):
		name = lunchpail.ComponentShortName(lunchpail.DispatcherComponent)
		workerStatus = statusFromPod(pod)
		model.Dispatcher = workerStatus
	case string(lunchpail.WorkersComponent):
		if pools, poolIdx, theWorkerStatus, err := updateWorker(name, pod, model.Pools, what); err != nil {
			return false, err
		} else {
			model.Pools = pools
			workerStatus = theWorkerStatus

			if workerIdx, exists := pod.Annotations["batch.kubernetes.io/job-completion-index"]; exists {
				name = fmt.Sprintf("Worker %s Pool %d", workerIdx, poolIdx+1)
			}
		}
	}

	if model.addMessage(Message{timeOf(pod), "Resource", name + " " + strings.ToLower(string(workerStatus))}) {
		return true, nil
	}

	return false, nil
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

func (model *Model) streamPodUpdates(watcher watch.Interface, c chan Model) error {
	for event := range watcher.ResultChan() {
		if event.Type == watch.Added || event.Type == watch.Deleted || event.Type == watch.Modified {
			pod := event.Object.(*v1.Pod)
			if updated, err := updateFromPod(pod, model, event.Type); err != nil {
				fmt.Fprintf(os.Stderr, "%v\n", err)
			} else if updated {
				c <- *model
			}
		}
	}

	return nil
}
