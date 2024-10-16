package workstealer

import (
	"cmp"
	"fmt"
	"os"
	"regexp"
	"slices"
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
	DispatcherDone
	ConsumedTask
	FinishedTask

	LiveWorker
	DeadWorker

	KillFileForWorker
	AssignedTaskByWorker
	ProcessingTaskByWorker
	SuccessfulTaskByWorker
	FailedTaskByWorker

	Nothing
)

var unassignedTaskPattern = regexp.MustCompile("^inbox/(.+)$")
var dispatcherDonePattern = regexp.MustCompile("^done$")
var consumedTaskPattern = regexp.MustCompile("^consumed/(.+)$")
var finishedTaskPattern = regexp.MustCompile("^finished/(.+)$")
var liveWorkerPattern = regexp.MustCompile("^queues/(.+)/inbox/[.]alive$")
var deadWorkerPattern = regexp.MustCompile("^queues/(.+)/inbox/[.]dead$")
var killfilePattern = regexp.MustCompile("^queues/(.+)/kill$")
var assignedTaskPattern = regexp.MustCompile("^queues/(.+)/inbox/(.+)$")
var processingTaskPattern = regexp.MustCompile("^queues/(.+)/processing/(.+)$")
var completedTaskPattern = regexp.MustCompile("^queues/(.+)/outbox/(.+)[.](succeeded|failed)$")

// Determine from a changed line the nature of `WhatChanged`
func (m *Model) whatChanged(line string) (WhatChanged, string, string) {
	if match := unassignedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return UnassignedTask, match[1], ""
	} else if match := dispatcherDonePattern.FindStringSubmatch(line); len(match) == 1 {
		return DispatcherDone, "", ""
	} else if match := consumedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return ConsumedTask, match[1], ""
	} else if match := finishedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return FinishedTask, match[1], ""
	} else if match := liveWorkerPattern.FindStringSubmatch(line); len(match) == 2 {
		return LiveWorker, match[1], ""
	} else if match := deadWorkerPattern.FindStringSubmatch(line); len(match) == 2 {
		return DeadWorker, match[1], ""
	} else if match := killfilePattern.FindStringSubmatch(line); len(match) == 2 {
		return KillFileForWorker, match[1], ""
	} else if match := assignedTaskPattern.FindStringSubmatch(line); len(match) == 3 {
		return AssignedTaskByWorker, match[1], match[2]
	} else if match := processingTaskPattern.FindStringSubmatch(line); len(match) == 3 {
		return ProcessingTaskByWorker, match[1], match[2]
	} else if match := completedTaskPattern.FindStringSubmatch(line); len(match) == 4 {
		if match[3] == "succeeded" {
			return SuccessfulTaskByWorker, match[1], match[2]
		} else {
			return FailedTaskByWorker, match[1], match[2]
		}
	}

	return Nothing, "", ""
}

// We will be passed a stream of diffs
func (m *Model) update(filepath string, workersLookup map[string]Worker) {
	what, thing, thing2 := m.whatChanged(filepath)

	switch what {
	case UnassignedTask:
		m.UnassignedTasks = append(m.UnassignedTasks, thing)
	case DispatcherDone:
		m.DispatcherDone = true
	case ConsumedTask:
		m.ConsumedTasks = append(m.ConsumedTasks, thing)
	case FinishedTask:
		m.FinishedTasks = append(m.FinishedTasks, thing)
	case LiveWorker:
		worker := Worker{true, 0, 0, thing, []string{}, []string{}, false}
		workersLookup[thing] = worker
	case DeadWorker:
		worker := Worker{false, 0, 0, thing, []string{}, []string{}, false}
		workersLookup[thing] = worker
	case KillFileForWorker:
		// thing is worker name
		if worker, ok := workersLookup[thing]; ok {
			workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail, worker.name, worker.assignedTasks, worker.processingTasks, true}
		} else {
			fmt.Fprintf(os.Stderr, "ERROR unable to find worker=%s\n", thing)
		}
	case AssignedTaskByWorker:
		// thing is worker name, thing2 is task name
		m.AssignedTasks = append(m.AssignedTasks, AssignedTask{thing, thing2})
		if worker, ok := workersLookup[thing]; ok {
			workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail, worker.name, append(worker.assignedTasks, thing2), worker.processingTasks, worker.killfilePresent}
		} else {
			fmt.Fprintf(os.Stderr, "ERROR Unable to find worker=%s\n", thing)
		}
	case ProcessingTaskByWorker:
		// thing is worker name, thing2 is task name
		m.ProcessingTasks = append(m.ProcessingTasks, AssignedTask{thing, thing2})
		if worker, ok := workersLookup[thing]; ok {
			workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail, worker.name, worker.assignedTasks, append(worker.processingTasks, thing2), worker.killfilePresent}
		} else {
			fmt.Fprintf(os.Stderr, "ERROR unable to find worker=%s\n", thing)
		}
	case SuccessfulTaskByWorker:
		// thing is worker name, thing2 is task name
		m.SuccessfulTasks = append(m.SuccessfulTasks, AssignedTask{thing, thing2})
		if worker, ok := workersLookup[thing]; ok {
			workersLookup[thing] = Worker{worker.alive, worker.nSuccess + 1, worker.nFail, worker.name, worker.assignedTasks, worker.processingTasks, worker.killfilePresent}
		} else {
			fmt.Fprintf(os.Stderr, "ERROR unable to find worker=%s\n", thing)
		}
	case FailedTaskByWorker:
		// thing is worker name, thing2 is task name
		m.FailedTasks = append(m.FailedTasks, AssignedTask{thing, thing2})
		if worker, ok := workersLookup[thing]; ok {
			workersLookup[thing] = Worker{worker.alive, worker.nSuccess, worker.nFail + 1, worker.name, worker.assignedTasks, worker.processingTasks, worker.killfilePresent}
		} else {
			fmt.Fprintf(os.Stderr, "ERROR unable to find worker=%s\n", thing)
		}
	}
}

func (m *Model) finishUp(workersLookup map[string]Worker) {
	for _, worker := range workersLookup {
		if worker.alive {
			m.LiveWorkers = append(m.LiveWorkers, worker)
		} else {
			m.DeadWorkers = append(m.DeadWorkers, worker)
		}
	}

	slices.SortFunc(m.LiveWorkers, func(a, b Worker) int {
		return cmp.Compare(a.name, b.name)
	})
	slices.SortFunc(m.DeadWorkers, func(a, b Worker) int {
		return cmp.Compare(a.name, b.name)
	})
}

// Return a model of the world
func (c client) fetchModel() Model {
	var m Model
	workersLookup := make(map[string]Worker)

	// we will strip off the queue path prefix below
	l := len(c.Spec.ListenPrefix + "/")

	for o := range c.s3.ListObjects(c.Spec.Bucket, c.Spec.ListenPrefix, true) {
		if len(o.Key) > l {
			if c.LogOptions.Debug {
				fmt.Fprintf(os.Stderr, "Updating model for: %s\n", o.Key[l:])
			}
			m.update(o.Key[l:], workersLookup)
		}
	}

	m.finishUp(workersLookup)
	return m
}
