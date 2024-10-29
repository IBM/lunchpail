package queuestreamer

import (
	"cmp"
	"fmt"
	"os"
	"slices"

	"lunchpail.io/pkg/ir/queue"
)

// We want to identify four classes of changes:
//
// 1. Unassigned/Assigned/Finished Tasks, indicated by any new files in inbox/assigned/finished
// 2. LiveWorkers, indicated by new .alive file in queues/{workerId}/inbox/.alive
// 3. DeadWorkers, indicated by deletion of .alive files
// 4. AssignedTaskByWorker, indicated by any new files in queues/{workerId}/inbox
// 5. ProcessingTaskByWorker, indicated by any new files in queues/{workerId}/processing
// 6. SuccessfulTaskByWorker, indicated by any new files in queues/{workerId}/outbox.succeeded
// 6. FailedTaskByWorker, indicated by any new files in queues/{workerId}/outbox.failed
type WhatChanged int

const (
	UnassignedTask WhatChanged = iota
	OutboxTask

	DispatcherDone

	LiveWorker
	DeadWorker

	KillFileForWorker
	AssignedTaskByWorker
	ProcessingTaskByWorker
	SuccessfulTaskByWorker
	FailedTaskByWorker

	Nothing
)

// Determine from a changed line the nature of `WhatChanged`
func (m *Model) whatChanged(line string, patterns PathPatterns) (what WhatChanged, pool string, worker string, task string) {
	what = Nothing

	if match := patterns.unassignedTask.FindStringSubmatch(line); len(match) == 2 {
		what = UnassignedTask
		task = match[1]
	} else if match := patterns.outboxTask.FindStringSubmatch(line); len(match) == 2 {
		what = OutboxTask
		task = match[1]
	} else if match := patterns.dispatcherDone.FindStringSubmatch(line); len(match) == 1 {
		what = DispatcherDone
	} else if match := patterns.liveWorker.FindStringSubmatch(line); len(match) == 3 {
		what = LiveWorker
		pool = match[1]
		worker = match[2]
	} else if match := patterns.deadWorker.FindStringSubmatch(line); len(match) == 3 {
		what = DeadWorker
		pool = match[1]
		worker = match[2]
	} else if match := patterns.killfile.FindStringSubmatch(line); len(match) == 3 {
		what = KillFileForWorker
		pool = match[1]
		worker = match[2]
	} else if match := patterns.assignedTask.FindStringSubmatch(line); len(match) == 4 {
		what = AssignedTaskByWorker
		pool = match[1]
		worker = match[2]
		task = match[3]
	} else if match := patterns.processingTask.FindStringSubmatch(line); len(match) == 4 {
		what = ProcessingTaskByWorker
		pool = match[1]
		worker = match[2]
		task = match[3]
	} else if match := patterns.succeededTask.FindStringSubmatch(line); len(match) == 4 {
		what = SuccessfulTaskByWorker
		pool = match[1]
		worker = match[2]
		task = match[3]
	} else if match := patterns.failedTask.FindStringSubmatch(line); len(match) == 4 {
		what = FailedTaskByWorker
		pool = match[1]
		worker = match[2]
		task = match[3]
	}

	return
}

func key(pool, worker string) string {
	return pool + "/" + worker
}

// We will be passed a stream of diffs
func (m *Model) update(filepath string, workersLookup map[string]*Worker, patterns PathPatterns) {
	what, pool, worker, task := m.whatChanged(filepath, patterns)
	k := key(pool, worker)

	switch what {
	case UnassignedTask:
		m.UnassignedTasks = append(m.UnassignedTasks, task)
	case OutboxTask:
		m.OutboxTasks = append(m.OutboxTasks, task)
	case DispatcherDone:
		m.DispatcherDone = true
	case LiveWorker:
		w, ok := workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			workersLookup[k] = w
		}
		w.Alive = true
	case DeadWorker:
		w, ok := workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			workersLookup[k] = w
		}
		w.Alive = false
	case KillFileForWorker:
		w, ok := workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			workersLookup[k] = w
		}
		w.KillfilePresent = true
	case AssignedTaskByWorker:
		m.AssignedTasks = append(m.AssignedTasks, AssignedTask{pool, worker, task})
		w, ok := workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			workersLookup[k] = w
		}
		w.AssignedTasks = append(w.AssignedTasks, task)
	case ProcessingTaskByWorker:
		m.ProcessingTasks = append(m.ProcessingTasks, AssignedTask{pool, worker, task})
		w, ok := workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			workersLookup[k] = w
		}
		w.ProcessingTasks = append(w.ProcessingTasks, task)
	case SuccessfulTaskByWorker:
		m.SuccessfulTasks = append(m.SuccessfulTasks, AssignedTask{pool, worker, task})
		w, ok := workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			workersLookup[k] = w
		}
		w.NSuccess++
	case FailedTaskByWorker:
		m.FailedTasks = append(m.FailedTasks, AssignedTask{pool, worker, task})
		w, ok := workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			workersLookup[k] = w
		}
		w.NFail++
	}
}

func (m *Model) finishUp(workersLookup map[string]*Worker) {
	for _, worker := range workersLookup {
		if worker.Alive {
			m.LiveWorkers = append(m.LiveWorkers, *worker)
		} else {
			m.DeadWorkers = append(m.DeadWorkers, *worker)
		}
	}

	slices.SortFunc(m.LiveWorkers, func(a, b Worker) int {
		return cmp.Compare(a.Name, b.Name)
	})
	slices.SortFunc(m.DeadWorkers, func(a, b Worker) int {
		return cmp.Compare(a.Name, b.Name)
	})
}

// Return a model of the world
func (c client) fetchModel() Model {
	var m Model
	workersLookup := make(map[string]*Worker)

	for o := range c.s3.ListObjects(c.RunContext.Bucket, c.RunContext.ListenPrefix(), true) {
		if c.LogOptions.Debug {
			fmt.Fprintf(os.Stderr, "Updating model for: %s\n", o.Key)
		}
		m.update(o.Key, workersLookup, c.pathPatterns)
	}
	for o := range c.s3.ListObjects(c.RunContext.Bucket, c.RunContext.AsFile(queue.AssignedAndFinished), true) {
		if c.LogOptions.Debug {
			fmt.Fprintf(os.Stderr, "Updating model for: %s\n", o.Key)
		}
		m.update(o.Key, workersLookup, c.pathPatterns)
	}

	m.finishUp(workersLookup)
	return m
}
