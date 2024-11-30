package queuestreamer

import (
	"cmp"
	"fmt"
	"os"
	"slices"
	"strconv"
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
func (m *Model) whatChanged(line string, patterns PathPatterns) (what WhatChanged, step int, pool string, worker string, task string, err error) {
	what = Nothing

	if match := patterns.unassignedTask.FindStringSubmatch(line); len(match) == 3 {
		what = UnassignedTask
		step, err = strconv.Atoi(match[1])
		task = match[2]
	} else if match := patterns.outboxTask.FindStringSubmatch(line); len(match) == 3 {
		what = OutboxTask
		step, err = strconv.Atoi(match[1])
		task = match[2]
	} else if match := patterns.dispatcherDone.FindStringSubmatch(line); len(match) == 2 {
		what = DispatcherDone
		step, err = strconv.Atoi(match[1])
	} else if match := patterns.liveWorker.FindStringSubmatch(line); len(match) == 4 {
		what = LiveWorker
		step, err = strconv.Atoi(match[1])
		pool = match[2]
		worker = match[3]
	} else if match := patterns.deadWorker.FindStringSubmatch(line); len(match) == 4 {
		what = DeadWorker
		step, err = strconv.Atoi(match[1])
		pool = match[2]
		worker = match[3]
	} else if match := patterns.killfile.FindStringSubmatch(line); len(match) == 4 {
		what = KillFileForWorker
		step, err = strconv.Atoi(match[1])
		pool = match[2]
		worker = match[3]
	} else if match := patterns.assignedTask.FindStringSubmatch(line); len(match) == 5 {
		what = AssignedTaskByWorker
		step, err = strconv.Atoi(match[1])
		pool = match[2]
		worker = match[3]
		task = match[4]
	} else if match := patterns.processingTask.FindStringSubmatch(line); len(match) == 5 {
		what = ProcessingTaskByWorker
		step, err = strconv.Atoi(match[1])
		pool = match[2]
		worker = match[3]
		task = match[4]
	} else if match := patterns.succeededTask.FindStringSubmatch(line); len(match) == 5 {
		what = SuccessfulTaskByWorker
		step, err = strconv.Atoi(match[1])
		pool = match[2]
		worker = match[3]
		task = match[4]
	} else if match := patterns.failedTask.FindStringSubmatch(line); len(match) == 5 {
		what = FailedTaskByWorker
		step, err = strconv.Atoi(match[1])
		pool = match[2]
		worker = match[3]
		task = match[4]
	}

	return
}

func key(pool, worker string) string {
	return pool + "/" + worker
}

// We will be passed a stream of diffs
func (model *Model) update(filepath string, patterns PathPatterns) {
	what, step, pool, worker, task, err := model.whatChanged(filepath, patterns)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Invalid path", filepath, err)
	}

	if len(model.Steps) <= step {
		steps := make([]Step, len(model.Steps))
		copy(steps, model.Steps)
		i := len(model.Steps)
		for i <= step {
			steps = append(steps, Step{Index: step})
			i++
		}
		model.Steps = steps
	}
	m := &model.Steps[step]
	if m._workersLookup == nil {
		m._workersLookup = make(map[string]*Worker)
	}

	k := key(pool, worker)

	switch what {
	case UnassignedTask:
		m.UnassignedTasks = append(m.UnassignedTasks, task)
	case OutboxTask:
		m.OutboxTasks = append(m.OutboxTasks, task)
	case DispatcherDone:
		m.DispatcherDone = true
	case LiveWorker:
		w, ok := m._workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			m._workersLookup[k] = w
		}
		w.Alive = true
	case DeadWorker:
		w, ok := m._workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			m._workersLookup[k] = w
		}
		w.Alive = false
	case KillFileForWorker:
		w, ok := m._workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			m._workersLookup[k] = w
		}
		w.KillfilePresent = true
	case AssignedTaskByWorker:
		m.AssignedTasks = append(m.AssignedTasks, AssignedTask{pool, worker, task})
		w, ok := m._workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			m._workersLookup[k] = w
		}
		w.AssignedTasks = append(w.AssignedTasks, task)
	case ProcessingTaskByWorker:
		m.ProcessingTasks = append(m.ProcessingTasks, AssignedTask{pool, worker, task})
		w, ok := m._workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			m._workersLookup[k] = w
		}
		w.ProcessingTasks = append(w.ProcessingTasks, task)
	case SuccessfulTaskByWorker:
		m.SuccessfulTasks = append(m.SuccessfulTasks, AssignedTask{pool, worker, task})
		w, ok := m._workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			m._workersLookup[k] = w
		}
		w.NSuccess++
	case FailedTaskByWorker:
		m.FailedTasks = append(m.FailedTasks, AssignedTask{pool, worker, task})
		w, ok := m._workersLookup[k]
		if !ok {
			w = &Worker{Pool: pool, Name: worker}
			m._workersLookup[k] = w
		}
		w.NFail++
	}
}

func (model *Model) finishUp() {
	for i, _ := range model.Steps {
		m := &model.Steps[i]
		for _, worker := range m._workersLookup {
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
}

// Return a model of the world
func (c client) fetchModel(anyStep bool) Model {
	var m Model

	for o := range c.s3.ListObjects(c.RunContext.Bucket, c.RunContext.ListenPrefixForAnyStep(anyStep), true) {
		if c.LogOptions.Debug {
			fmt.Fprintf(os.Stderr, "Updating model for: %s\n", o.Key)
		}
		m.update(o.Key, c.pathPatterns)
	}

	m.finishUp()
	return m
}
