package status

import (
	"slices"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type WorkerStatus string

const (
	Pending     WorkerStatus = "Pending"
	Running                  = "Running"
	Succeeded                = "Succeeded"
	Failed                   = "Failed"
	Terminating              = "Terminating"
)

type Worker struct {
	Name   string
	Status WorkerStatus
}

type Pool struct {
	Name    string
	Workers []Worker
}

type Event struct {
	Message string
	Timestamp metav1.Time
}

type Status struct {
	AppName    string
	RunName    string
	Pools      []Pool
	Runtime    WorkerStatus
	InternalS3 WorkerStatus
	WorkStealer WorkerStatus
	LastEvent  Event
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

// return the pair (numRunning, numTotal) of Runtime pods
func (status *Status) split(ws WorkerStatus) (int, int) {
	if ws == Running {
		return 1, 1
	} else {
		return 0, 1
	}
}

// return the pair (numRunning, numTotal) of Workers across all Pools
func (status *Status) workersSplit() (int, int) {
	running := 0
	total := 0
	for _, pool := range status.Pools {
		total += len(pool.Workers)
		for _, worker := range pool.Workers {
			if worker.Status == Running {
				running++
			}
		}
	}

	return running, total
}
