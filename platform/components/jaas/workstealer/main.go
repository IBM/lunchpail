package main

import (
	"os"
	"fmt"
	"log"
	"bufio"
	"regexp"
	"math/rand"
	"path/filepath"
)

//
// We want to identify four classes of changes:
//
// 1. Unassigned/Assigned/Finished Tasks, indicated by any new files in inbox/assigned/finished
// 2. LiveWorkers, indicated by new .alive file in queues/{workerId}/inbox/.alive
// 3. DeadWorkers, indicated by deletion of .alive files
// 4. AssignedTaskByWorker, indicated by any new files in queues/{workerId}/inbox
// 5. ProcessingTaskByWorker, indicated by any new files in queues/{workerId}/processing
// 6. CompletedTaskByWorker, indicated by any new files in queues/{workerId}/outbox
//
type HowChanged int
const (
	Added HowChanged = iota
	Removed
	Unchanged
)
type WhatChanged int
const (
	UnassignedTask WhatChanged = iota
	FinishedTask

	LiveWorker
	DeadWorker

	AssignedTaskByWorker
	ProcessingTaskByWorker
	CompletedTaskByWorker

	Nothing
)

//
// A Task that was completed by a given Worker
//
type AssignedTask struct {
	worker string
	task string
}

type Worker struct {
	alive bool
	name string
	assignedTasks []string
	processingTasks []string
}

//
// The current state of the world
//
type Model struct {
	UnassignedTasks []string
	FinishedTasks []string
	LiveWorkers []Worker
	DeadWorkers []Worker

	AssignedTasks []AssignedTask
	ProcessingTasks []AssignedTask
	CompletedTasks []AssignedTask
}

var run = os.Getenv("RUN_NAME")
var queue = os.Getenv("QUEUE")
var inbox = filepath.Join(queue, os.Getenv("UNASSIGNED_INBOX"))
var finished = filepath.Join(queue, "finished")
var outbox = filepath.Join(queue, os.Getenv("FULLY_DONE_OUTBOX"))
var queues = filepath.Join(queue, os.Getenv("WORKER_QUEUES_SUBDIR"))

var unassignedTaskPattern = regexp.MustCompile("^inbox/(.+)$")
var finishedTaskPattern = regexp.MustCompile("^finished/(.+)$")
var liveWorkerPattern = regexp.MustCompile("^queues/(.+)/inbox/[.]alive$")
var assignedTaskPattern = regexp.MustCompile("^queues/(.+)/inbox/(.+)$")
var processingTaskPattern = regexp.MustCompile("^queues/(.+)/processing/(.+)$")
var completedTaskPattern = regexp.MustCompile("^queues/(.+)/outbox/(.+)$")

//
// Emit the path to the file we deleted
//
func reportMovedFile(src, dst string) {
	fmt.Printf("%s %s move\n", src, dst)
}

//
// Emit the path to the file we changed
//
func reportChangedFile(filepath string) {
	fmt.Printf("%s\n", filepath)
}

//
// Record the current state of Model for observability
//
func reportState(model Model) {
	fmt.Fprintf(os.Stderr, "lunchpail.io unassigned %d %s\n", len(model.UnassignedTasks), run)
	fmt.Fprintf(os.Stderr, "lunchpail.io assigned %d %s\n", len(model.AssignedTasks), run)
	fmt.Fprintf(os.Stderr, "lunchpail.io processing %d %s\n", len(model.ProcessingTasks), run)
	fmt.Fprintf(os.Stderr, "lunchpail.io done %d %s\n", len(model.FinishedTasks), run)
	fmt.Fprintf(os.Stderr, "lunchpail.io liveworkers %d %s\n", len(model.LiveWorkers), run)

	for _, worker := range model.LiveWorkers {
		fmt.Fprintf(os.Stderr, "lunchpail.io liveworker %s %d %d %s\n", worker.name, len(worker.assignedTasks), len(worker.processingTasks), run)
	}
}

//
// Determine from a diff the `HowChanged` property
//
func howChanged(marker byte) HowChanged {
	switch marker {
	case '+':
		return Added
	case '-':
		return Removed
	default:
		return Unchanged
	}
}

//
// Determine from a HowChanged (Added, Removed, Unchanged) and a
// changed line the nature of `WhatChanged`
//
func whatChanged(line string, how HowChanged) (WhatChanged, string, string) {
	if match := unassignedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return UnassignedTask, match[1], ""
	} else if match := finishedTaskPattern.FindStringSubmatch(line); len(match) == 2 {
		return FinishedTask, match[1], ""
	} else if match := liveWorkerPattern.FindStringSubmatch(line); len(match) == 2 {
		if how == Removed {
			return DeadWorker, match[1], ""
		} else {
			return LiveWorker, match[1], ""
		}
	} else if match := assignedTaskPattern.FindStringSubmatch(line); len(match) == 3 {
		return AssignedTaskByWorker, match[1], match[2]
	} else if match := processingTaskPattern.FindStringSubmatch(line); len(match) == 3 {
		return ProcessingTaskByWorker, match[1], match[2]
	} else if match := completedTaskPattern.FindStringSubmatch(line); len(match) == 3 {
		return CompletedTaskByWorker, match[1], match[2]
	}

	return Nothing, "", ""
}

//
// We will be passed a stream of diffs
//
func parseUpdatesFromStdin() Model {
	scanner := bufio.NewScanner(os.Stdin)

	unassignedTasks := []string{}
	finishedTasks := []string{}
	assignedTasks := []AssignedTask{}
	processingTasks := []AssignedTask{}
	completedTasks := []AssignedTask{}

	workersLookup := make(map[string]Worker)

	for scanner.Scan() {
		line := scanner.Text()
		how := howChanged(line[0])
		what, thing, thing2 := whatChanged(line[1:], how)

		fmt.Fprintf(os.Stderr, "[workstealer] Update how=%v what=%v thing=%s thing2=%v line=%s\n", how, what, thing, thing2, line)

		switch what {
		case UnassignedTask:
			unassignedTasks = append(unassignedTasks, thing)
		case FinishedTask:
			finishedTasks= append(finishedTasks, thing)
		case LiveWorker:
			worker := Worker{true, thing, []string{}, []string{}}
			workersLookup[thing] = worker
		case DeadWorker:
			worker := Worker{false, thing, []string{}, []string{}}
			workersLookup[thing] = worker
		case AssignedTaskByWorker:
			// thing is worker name, thing2 is task name
			assignedTasks = append(assignedTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.name, append(worker.assignedTasks, thing2), worker.processingTasks}
			} else {
				fmt.Fprintf(os.Stderr, "[workstealer] Error unable to find worker=%s\n", thing)
			}
		case ProcessingTaskByWorker:
			// thing is worker name, thing2 is task name
			processingTasks = append(processingTasks, AssignedTask{thing, thing2})
			if worker, ok := workersLookup[thing]; ok {
				workersLookup[thing] = Worker{worker.alive, worker.name, worker.assignedTasks, append(worker.processingTasks, thing2)}
			} else {
				fmt.Fprintf(os.Stderr, "[workstealer] Error unable to find worker=%s\n", thing)
			}
		case CompletedTaskByWorker:
			// thing is worker name, thing2 is task name
			completedTasks = append(completedTasks, AssignedTask{thing, thing2})
		}
	}

	if err := scanner.Err(); err != nil {
		log.Fatalf("[workerstealer] Error parsing model from stdin: %v\n", err)
	}

	liveWorkers := []Worker{}
	deadWorkers := []Worker{}
	for _, worker := range workersLookup {
		if worker.alive {
			liveWorkers = append(liveWorkers, worker)
		} else {
			deadWorkers = append(deadWorkers, worker)
		}
	}
	
	return Model{unassignedTasks, finishedTasks, liveWorkers, deadWorkers, assignedTasks, processingTasks, completedTasks}
}

//
// Return a model of the world
//
func ParseUpdates() Model {
	return parseUpdatesFromStdin()
}

//
// Pick a good worker to assign work to. For now, this is
// random. TODO: be intelligent about distributing load.
//
func pickAWorker(liveWorkers []Worker) int {
	nWorkers := len(liveWorkers)
	if nWorkers == 0 {
		return -1
	} else {
		return rand.Intn(nWorkers)
	}
}

//
// A Task has been fully completed by a Worker
//
func MarkDone(task string) {
	finishedMarker := filepath.Join(finished, task)
	if err := os.MkdirAll(finished, 0700); err != nil {
		log.Fatalf("[workstealer] Failed to create finished directory: %v\n", err)
	} else if err := os.WriteFile(finishedMarker, []byte{}, 0644); err != nil {
		log.Fatalf("[workstealer] Failed to touch finished marker: %v\n", err)
	} else {
		reportChangedFile(finishedMarker)
	}
}

//
// As part of assigning a Task to a Worker, we will move the Task to its Inbox
//
func MoveToWorkerInbox(task string, worker Worker) {
	unassignedFilePath := filepath.Join(inbox, task)
	workerInboxFilePath := filepath.Join(queues, worker.name, "inbox", task)

	if err := os.Rename(unassignedFilePath, workerInboxFilePath); err != nil {
		log.Fatalf("[workstealer] Failed to move task=%s to worker inbox unassignedFilePath=%s workerInboxFilePath=%s: %v\n", task, unassignedFilePath, workerInboxFilePath, err)
	} else {
		reportMovedFile(unassignedFilePath, workerInboxFilePath)
	}
}

//
// Indicate that we are not yet ready to process this Task,
// e.g. because there are no LiveWorkers
//
func IgnoreTaskForNow(task string) {
	fmt.Fprintf(os.Stderr, "[workstealer] Ignoring unassigned task for now: %s\n", task)
	unassignedFilePath := filepath.Join(inbox, task)
	if err := os.Remove(unassignedFilePath); err != nil {
		log.Fatalf("[workstealer] Failed to remove task from unassigned: %v\n", err)
	}
}

//
// As part of finishing up a Task, move it from the Worker's Outbox to the final Outbox
//
func MoveToFinalOutbox(task string, worker string) {
	fileInWorkerOutbox := filepath.Join(queues, worker, "outbox", task)
	fullyDoneOutputFilePath := filepath.Join(outbox, task)

	if err := os.MkdirAll(outbox, 0700); err != nil {
		log.Fatalf("[workstealer] Failed to create outbox directory: %v\n", err)
	} else if err := os.Rename(fileInWorkerOutbox, fullyDoneOutputFilePath); err != nil {
		log.Fatalf("[workstealer] Failed to move output to final outbox: %v\n", err)
	} else {
		reportMovedFile(fileInWorkerOutbox, fullyDoneOutputFilePath)
	}
}

//
// Assign an unassigned Task to one of the given LiveWorkers
//
func AssignNewTask(task string, liveWorkers []Worker) {
	liveWorkerIdx := pickAWorker(liveWorkers)
	if liveWorkerIdx != -1 {
		fmt.Fprintf(os.Stderr, "[workstealer] Assigning to worker=%s task=%s\n", liveWorkers[liveWorkerIdx].name, task)
		MoveToWorkerInbox(task, liveWorkers[liveWorkerIdx])
	} else {
		IgnoreTaskForNow(task)
	}
}

type Box string
const (
	Inbox = "inbox"
	Processing = "processing"
	Outbox = "outbox"
)

//
// A Worker has died. Unassign this task that it owns
//
func moveTaskBackToUnassigned(task string, worker Worker, box Box) {
	inWorkerFilePath := filepath.Join(queues, worker.name, string(box), task)
	unassignedFilePath := filepath.Join(inbox, task)

	if err := os.MkdirAll(inbox, 0700); err != nil {
		log.Fatalf("[workstealer] Failed to create inbox directory: %v\n", err)
	} else if err := os.Rename(inWorkerFilePath, unassignedFilePath); err != nil {
		log.Fatalf("[workstealer] Failed to move assigned task back to unassigned: %v\n", err)
	} else {
		reportMovedFile(inWorkerFilePath, unassignedFilePath)
	}
}

//
// A Worker has transitioned from Live to Dead. Reassign its Tasks.
//
func CleanupForDeadWorker(worker Worker) {
	for _, assignedTask := range worker.assignedTasks {
		moveTaskBackToUnassigned(assignedTask, worker, "inbox")
	}
	for _, assignedTask := range worker.processingTasks {
		moveTaskBackToUnassigned(assignedTask, worker, "processing")
	}
}

//
// A Task has completed
//
func CleanupForCompletedTask(completedTask AssignedTask) {
	MarkDone(completedTask.task)
	MoveToFinalOutbox(completedTask.task, completedTask.worker)
}

func assignNewTasks(model Model) {
	for _, task := range model.UnassignedTasks {
		AssignNewTask(task, model.LiveWorkers)
	}
}

//
// Handle dead Workers
//
func reassignDeadWorkerTasks(model Model) {
	for _, worker := range model.DeadWorkers {
		CleanupForDeadWorker(worker)
	}
}

//
// Handle completed Tasks
//
func cleanupCompletedTasks(model Model) {
	for _, completedTask := range model.CompletedTasks {
		CleanupForCompletedTask(completedTask)
	}
}

//
// See if we need to rebalance workloads
//
func rebalance(model Model) bool {
	if len(model.UnassignedTasks) == 0 {
		// If we had some unassigned Tasks, we probably
		// wouldnm't need to rebalance; we could just send
		// those Tasks to the starving Workers. Since we have
		// no unassigned Tasks, we might want to consider
		// reassigning Tasks between Workers.

		// Tally up live Workers with and without work. We aim
		// to shift load from those with to those without.
		workersWithWork := []Worker{}
		workersWithoutWork := []Worker{}
		for _, worker := range model.LiveWorkers {
			if len(worker.assignedTasks) == 0 {
				workersWithoutWork = append(workersWithoutWork, worker)
			} else {
				workersWithWork = append(workersWithWork, worker)
			}
		}

		if len(workersWithWork) > 0 && len(workersWithoutWork) > 0 {
			// Then we can shift load from those with to
			// those without!
			desiredLevel := max(1, (len(model.AssignedTasks) + len(model.ProcessingTasks)) / len(model.LiveWorkers))
			fmt.Fprintf(os.Stderr, "[workstealer] Rebalancing to desiredLevel=%d\n", desiredLevel)

			// then we can steal at least one Task 
			for _, workerWithWork := range workersWithWork {
				stealThisMany := max(0, len(workerWithWork.assignedTasks) - desiredLevel)
				fmt.Fprintf(os.Stderr, "[workstealer] Rebalancer stealing %d tasks from worker=%s\n", stealThisMany, workerWithWork.name)

				for i := range stealThisMany {
					j := len(workerWithWork.assignedTasks) - i - 1
					taskToSteal := workerWithWork.assignedTasks[j]
					moveTaskBackToUnassigned(taskToSteal, workerWithWork, "inbox")
				}
			}

			// Indicate that we did rebalance
			return true
		}
	}

	// Indicate that we didn't rebalance
	return false
}

//
// Assumed to be called every time something has changed in the
// `queue` directory. This will emit to stdout a newline-separated
// stream of filepaths, one per file that it has changed in some way.
//
func main() {
	// fmt.Fprintf(os.Stderr, "[workstealer] Starting with inbox=%s outbox=%s queues=%s\n", inbox, outbox, queues)
	model := ParseUpdates()
	reportState(model)

	if !rebalance(model) {
		assignNewTasks(model)
		reassignDeadWorkerTasks(model)
		cleanupCompletedTasks(model)
	}
}
