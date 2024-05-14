package status

import (
	"container/ring"
	"lunchpail.io/pkg/shrinkwrap/qstat"
	"slices"
	"sort"
	"time"
)

type WorkerStatus string

const (
	Pending     WorkerStatus = "Pending"
	Booting                  = "Booting"
	Running                  = "Running"
	Succeeded                = "Succeeded"
	Failed                   = "Failed"
	Terminating              = "Terminating"
)

type Worker struct {
	Name   string
	Status WorkerStatus
	Qstat  qstat.Worker
}

type Pool struct {
	Name    string
	Workers []Worker
}

type Event struct {
	Message   string
	Timestamp time.Time
}

type Model struct {
	AppName     string
	RunName     string
	Pools       []Pool
	Runtime     WorkerStatus
	InternalS3  WorkerStatus
	WorkStealer WorkerStatus
	LastNEvents *ring.Ring
	Qstat       qstat.Model
}

func (model *Model) numPools() int {
	return len(model.Pools)
}

func (model *Model) workers() []Worker {
	workers := []Worker{}
	for _, pool := range model.Pools {
		workers = slices.Concat(workers, pool.Workers)
	}
	return workers
}

// return the pair (numRunning, numTotal) of Runtime pods
func (model *Model) split(ws WorkerStatus) (int, int) {
	if ws == Running {
		return 1, 1
	} else {
		return 0, 1
	}
}

// return the pair (numRunning, numTotal) of Workers across all Pools
func (model *Model) workersSplit() (int, int) {
	running := 0
	total := 0

	for _, pool := range model.Pools {
		r, t := pool.workersSplit()
		running += r
		total += t
	}

	return running, total
}

// return the pair (numRunning, numTotal) of Workers for the given Pool
func (pool *Pool) workersSplit() (int, int) {
	running := 0
	total := len(pool.Workers)

	for _, worker := range pool.Workers {
		if worker.Status == Running {
			running++
		}
	}

	return running, total
}

// return the maximum size of any task box
func (model *Model) maxbox() int {
	N := max(model.Qstat.Unassigned, model.Qstat.Assigned, model.Qstat.Processing, model.Qstat.Success, model.Qstat.Failure)

	for _, pool := range model.Pools {
		for _, worker := range pool.Workers {
			N = max(N, worker.Qstat.Inbox, worker.Qstat.Processing, worker.Qstat.Outbox, worker.Qstat.Errorbox)
		}
	}

	return N
}

// return total across pools and workers of Inbox count
func (model *Model) allInbox() int {
	N := 0

	for _, pool := range model.Pools {
		for _, worker := range pool.Workers {
			N += worker.Qstat.Inbox
		}
	}

	return N
}

// return (inbox, processing, success, failure) across all Workers
func (pool *Pool) qsummary() (int, int, int, int) {
	inbox := 0
	processing := 0
	success := 0
	failure := 0

	for _, worker := range pool.Workers {
		inbox += worker.Qstat.Inbox
		processing += worker.Qstat.Processing
		success += worker.Qstat.Outbox
		failure += worker.Qstat.Errorbox
	}

	return inbox, processing, success, failure
}

// return list of most recent events, sorted by increasing timestamp
func (model *Model) events() []Event {
	events := []Event{}
	model.LastNEvents.Do(func(value any) {
		if event, ok := value.(Event); ok {
			events = append(events, event)
		}
	})

	sort.Slice(events, func(i, j int) bool {
		return events[i].Timestamp.Before(events[j].Timestamp)
	})

	return events
}
